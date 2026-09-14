import { useEffect, useRef, useState } from 'react'
import { requestJourneyCheck } from '../api/journey-check'
import { findStationByName } from '../data/stations'
import {
  defaultArriveBy,
  defaultArriveByInstant,
  toLocalDateTimeValue,
} from '../components/journey-time'
import type { DeadlineEdit } from '../components/JourneyForm'
import {
  journeyStorageKey,
  journeyDraft,
  draftAfterCheck,
  endJourney as endProtectedJourney,
  loadJourneyLibrary,
  persistJourneyLibrary,
  rememberJourney,
  removeJourney,
  setJourneyLeg,
  startJourney,
  type JourneyInput,
  type JourneyLibrary,
  type SavedJourney,
} from './journey-store'
import {
  canonicalTubeStationName,
  explainUnverified,
  validateJourneyInput,
} from './journey-presentation'
import { createRequestGate } from './request-gate'
import type { JourneyFocusIntent } from './journey-focus'

export const newJourneyInput = (): JourneyInput => ({
  originName: '',
  destinationName: '',
  arriveBy: defaultArriveBy(),
  safetyBufferMinutes: '5',
})
export function useJourneyWorkspace() {
  const [initialDefaultInstant] = useState(() => defaultArriveByInstant())
  const [initial] = useState(loadJourneyLibrary)
  const [library, setLibrary] = useState(initial.library)
  const libraryRef = useRef(library)
  // A direct load of the Journey page is always a fresh planning surface.
  // Saved/protected snapshots remain in the library and are opened explicitly.
  const [shown, setShown] = useState<SavedJourney | null>(null)
  const [draft, setDraft] = useState<JourneyInput>(() => ({
    ...newJourneyInput(),
    arriveBy: toLocalDateTimeValue(initialDefaultInstant),
  }))
  const [draftDeadlineAtMs, setDraftDeadlineAtMs] = useState<number | null>(
    initialDefaultInstant.getTime(),
  )
  const defaultDeadlineRef = useRef(draft.arriveBy)
  const defaultDeadlineInstantRef = useRef<number | null>(initialDefaultInstant.getTime())
  const defaultDeadlineRollingRef = useRef(true)
  const [returnJourneyFrom, setReturnJourneyFrom] = useState<SavedJourney | null>(null)
  const [storageWarning, setStorageWarning] = useState(initial.warning)
  const [pending, setPending] = useState<JourneyInput | null>(null)
  const [error, setError] = useState<{
    message: string
    field?: string
    input: JourneyInput
  } | null>(null)
  const [focusVersion, setFocusVersion] = useState(0)
  const [focusIntent, setFocusIntent] = useState<JourneyFocusIntent>('page')
  const [editing, setEditing] = useState(true)
  const gate = useRef(createRequestGate())
  useEffect(() => {
    const current = gate.current
    return () => current.cancel()
  }, [])
  useEffect(() => {
    const refreshDefaultDeadline = () => {
      if (!defaultDeadlineRollingRef.current) return
      const nextInstant = defaultArriveByInstant()
      const next = toLocalDateTimeValue(nextInstant)
      const previous = defaultDeadlineRef.current
      defaultDeadlineRef.current = next
      defaultDeadlineInstantRef.current = nextInstant.getTime()
      setDraftDeadlineAtMs(nextInstant.getTime())
      setDraft((current) =>
        current.arriveBy === previous ? { ...current, arriveBy: next } : current,
      )
    }
    const timer = window.setInterval(refreshDefaultDeadline, 60_000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key !== journeyStorageKey && event.key !== null) return
      gate.current.cancel()
      setPending(null)
      const loaded = loadJourneyLibrary()
      libraryRef.current = loaded.library
      setLibrary(loaded.library)
      setStorageWarning(
        loaded.warning ||
          'Saved journeys changed in another tab. Your open itinerary has not been refreshed.',
      )
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  function cancelCheck() {
    gate.current.cancel()
    setPending(null)
  }
  function updateLibrary(next: JourneyLibrary) {
    libraryRef.current = next
    setLibrary(next)
    setStorageWarning(
      persistJourneyLibrary(next)
        ? ''
        : 'Changes could not be saved on this device. Keep this page open; a reload may restore an older plan.',
    )
  }
  function editDraft(next: JourneyInput, deadlineEdit?: DeadlineEdit) {
    cancelCheck()
    setError(null)
    defaultDeadlineRollingRef.current = false
    if (deadlineEdit?.kind === 'preset') {
      defaultDeadlineInstantRef.current = deadlineEdit.atMs
      setDraftDeadlineAtMs(deadlineEdit.atMs)
    } else if (deadlineEdit?.kind === 'manual') {
      const nextDeadlineAtMs = deadlineEdit.atMs ?? null
      defaultDeadlineInstantRef.current = nextDeadlineAtMs
      setDraftDeadlineAtMs(nextDeadlineAtMs)
    }
    // Any form edit, including a quick deadline preset, makes this an explicit
    // user choice. Do not let the rolling default clock change it underneath.
    defaultDeadlineRef.current = ''
    setDraft(next)
  }
  async function check(input: JourneyInput, source: 'draft' | 'saved' = 'draft') {
    cancelCheck()
    const deadlineAtMs =
      source === 'draft' && input.arriveBy === draft.arriveBy
        ? defaultDeadlineInstantRef.current ?? undefined
        : undefined
    const validation = validateJourneyInput(input, Date.now(), deadlineAtMs)
    if (validation) {
      setError({ ...validation, input })
      return
    }
    const origin = findStationByName(input.originName.trim())!
    const destination = findStationByName(input.destinationName)!
    const requested = {
      ...input,
      originName: input.originName.trim(),
      destinationName: destination.name,
    }
    const ticket = gate.current.begin()
    setError(null)
    setPending(requested)
    try {
      const response = await requestJourneyCheck(
        {
          origin: { name: origin.name, tflStopPointId: origin.id },
          destination,
          arriveBy: input.arriveBy,
          arriveByAtMs: deadlineAtMs,
          safetyBufferMinutes: Number(input.safetyBufferMinutes),
        },
        ticket.signal,
      )
      if (!ticket.isCurrent()) return
      if (response.status === 'unable_to_verify' || !response.route?.legs.length) {
        setError({
          input: requested,
          message: explainUnverified(response),
        })
        return
      }
      const snapshot: SavedJourney = {
        id: crypto.randomUUID(),
        savedAt: new Date().toISOString(),
        input: { ...requested, arriveBy: response.deadline.arriveBy },
        response,
      }
      // A checked draft is now an explicit result, not an untouched generated
      // deadline. Prevent the rolling default clock from changing it later.
      if (source === 'draft') {
        defaultDeadlineRollingRef.current = false
        defaultDeadlineRef.current = ''
        const responseDeadlineAtMs = Date.parse(response.deadline.arriveBy)
        defaultDeadlineInstantRef.current = responseDeadlineAtMs
        setDraftDeadlineAtMs(responseDeadlineAtMs)
      }
      updateLibrary(rememberJourney(libraryRef.current, snapshot))
      setShown(snapshot)
      setReturnJourneyFrom(null)
      setDraft((current) => draftAfterCheck(current, snapshot.input, source))
      setFocusIntent('result')
      setFocusVersion((value) => value + 1)
    } catch (failure) {
      if (ticket.isCurrent())
        setError({
          input: requested,
          message:
            failure instanceof Error
              ? failure.message
              : 'The check could not be completed. Try again.',
        })
    } finally {
      if (ticket.isCurrent()) setPending(null)
    }
  }
  function openJourney(journey: SavedJourney) {
    cancelCheck()
    setError(null)
    setShown(journey)
    setReturnJourneyFrom(null)
    setEditing(false)
    setFocusIntent('result')
    setFocusVersion((value) => value + 1)
  }
  function planReturnJourney(journey: SavedJourney) {
    cancelCheck()
    setError(null)
    setShown(journey)
    setReturnJourneyFrom(journey)
    const arriveByInstant = defaultArriveByInstant()
    const arriveBy = toLocalDateTimeValue(arriveByInstant)
    defaultDeadlineRef.current = arriveBy
    defaultDeadlineInstantRef.current = arriveByInstant.getTime()
    setDraftDeadlineAtMs(arriveByInstant.getTime())
    defaultDeadlineRollingRef.current = true
    setDraft({
      ...journeyDraft(journey.input),
      originName:
        canonicalTubeStationName(journey.input.destinationName) ?? journey.input.destinationName,
      destinationName:
        canonicalTubeStationName(journey.input.originName) ?? journey.input.originName,
      arriveBy,
    })
    setEditing(true)
    setFocusIntent('form')
    setFocusVersion((value) => value + 1)
  }
  function beginJourney(journey: SavedJourney, expectedActiveId: string | null) {
    cancelCheck()
    if (
      (libraryRef.current.active?.id ?? null) !== expectedActiveId ||
      !journey.response.route?.legs.length ||
      !['viable', 'tight'].includes(journey.response.status) ||
      Date.parse(journey.input.arriveBy) <= Date.now() ||
      Date.parse(journey.response.route.legs[0].departureAt) <= Date.now()
    )
      return
    updateLibrary(startJourney(rememberJourney(libraryRef.current, journey), journey.id))
    openJourney(journey)
  }
  function endJourney(expectedId: string) {
    cancelCheck()
    updateLibrary(endProtectedJourney(libraryRef.current, expectedId))
  }
  function forgetJourney(id: string) {
    updateLibrary(removeJourney(libraryRef.current, id))
    if (shown?.id === id && libraryRef.current.active?.id !== id) setShown(null)
  }
  function explore(input?: JourneyInput) {
    cancelCheck()
    setError(null)
    setReturnJourneyFrom(null)
    defaultDeadlineRollingRef.current = false
    if (input) {
      const deadlineAtMs = Date.parse(input.arriveBy)
      defaultDeadlineInstantRef.current = Number.isFinite(deadlineAtMs) ? deadlineAtMs : null
      setDraftDeadlineAtMs(Number.isFinite(deadlineAtMs) ? deadlineAtMs : null)
      setDraft(journeyDraft(input))
    }
    setEditing(true)
    setFocusIntent('form')
    setFocusVersion((value) => value + 1)
  }
  function startNewJourney() {
    cancelCheck()
    setError(null)
    setReturnJourneyFrom(null)
    const nextInstant = defaultArriveByInstant()
    const next = { ...newJourneyInput(), arriveBy: toLocalDateTimeValue(nextInstant) }
    defaultDeadlineRef.current = next.arriveBy
    defaultDeadlineInstantRef.current = nextInstant.getTime()
    setDraftDeadlineAtMs(nextInstant.getTime())
    defaultDeadlineRollingRef.current = true
    setDraft(next)
    setEditing(true)
    setFocusIntent('form')
    setFocusVersion((value) => value + 1)
  }
  return {
    library,
    shown,
    draft,
    draftDeadlineAtMs,
    storageWarning,
    pending,
    error,
    returnJourneyFrom,
    focusVersion,
    focusIntent,
    editing,
    active: library.journeys.find((item) => item.id === library.active?.id) ?? null,
    editDraft,
    check,
    cancelCheck,
    openJourney,
    planReturnJourney,
    beginJourney,
    endJourney,
    forgetJourney,
    explore,
    startNewJourney,
    changeLeg: (index: number) => updateLibrary(setJourneyLeg(libraryRef.current, index)),
  }
}
