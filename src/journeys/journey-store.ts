import { isJourneyResponse } from '../api/journey-response.ts'
import type { JourneyResponse } from '../types/journey'
import { toLocalDateTimeValue } from '../components/journey-time.ts'

export interface JourneyInput {
  originName: string
  destinationName: string
  arriveBy: string
  safetyBufferMinutes: string
}
export interface SavedJourney {
  id: string
  savedAt: string
  input: JourneyInput
  response: JourneyResponse
}
export interface JourneyLibrary {
  version: 2
  journeys: SavedJourney[]
  active: { id: string; legIndex: number } | null
}
export const journeyStorageKey = 'lastlink.journeys.v2'
const legacyKeys = ['lastlink.active-journeys.v1', 'lastlink.active-journey.v1']
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
export const emptyLibrary = (): JourneyLibrary => ({ version: 2, journeys: [], active: null })

export function journeyDraft(input: JourneyInput): JourneyInput {
  return {
    ...input,
    arriveBy: Number.isFinite(Date.parse(input.arriveBy))
      ? toLocalDateTimeValue(new Date(input.arriveBy))
      : input.arriveBy,
  }
}
function canonicalJourney(journey: SavedJourney): SavedJourney {
  // The response retains the absolute deadline, including for legacy wall-time inputs.
  return {
    ...journey,
    input: {
      ...journey.input,
      arriveBy: new Date(journey.response.deadline.arriveBy).toISOString(),
    },
  }
}
export function draftAfterCheck(
  draft: JourneyInput,
  checkedInput: JourneyInput,
  source: 'draft' | 'saved',
): JourneyInput {
  return source === 'draft' ? journeyDraft(checkedInput) : draft
}

export function isJourneyInput(value: unknown): value is JourneyInput {
  return (
    isRecord(value) &&
    ['originName', 'destinationName', 'arriveBy'].every(
      (key) => typeof value[key] === 'string' && value[key].length > 0 && value[key].length <= 120,
    ) &&
    Number.isFinite(Date.parse(value.arriveBy as string)) &&
    ['0', '5', '10', '15'].includes(value.safetyBufferMinutes as string)
  )
}
function isSavedJourney(value: unknown): value is SavedJourney {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.savedAt === 'string' &&
    Number.isFinite(Date.parse(value.savedAt)) &&
    isJourneyInput(value.input) &&
    isJourneyResponse(value.response) &&
    value.response.route !== null &&
    value.response.route.legs.length > 0 &&
    value.response.status !== 'unable_to_verify'
  )
}
export function isJourneyLibrary(value: unknown): value is JourneyLibrary {
  if (
    !isRecord(value) ||
    value.version !== 2 ||
    !Array.isArray(value.journeys) ||
    value.journeys.length > 3 ||
    !value.journeys.every(isSavedJourney) ||
    new Set(value.journeys.map((journey) => journey.id)).size !== value.journeys.length
  )
    return false
  if (value.active === null) return true
  if (!isRecord(value.active)) return false
  const active = value.active
  const journey = value.journeys.find((item) => item.id === active.id)
  return (
    journey !== undefined &&
    Number.isInteger(active.legIndex) &&
    Number(active.legIndex) >= 0 &&
    Number(active.legIndex) < journey.response.route!.legs.length
  )
}
export function browserJourneyStorage(): StorageLike | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}
export function loadJourneyLibrary(storage = browserJourneyStorage()): {
  library: JourneyLibrary
  warning: string
} {
  if (!storage)
    return {
      library: emptyLibrary(),
      warning: 'Saving is unavailable in this browser. Keep this page open.',
    }
  try {
    const current = storage.getItem(journeyStorageKey)
    if (current !== null) {
      const parsed: unknown = JSON.parse(current)
      return isJourneyLibrary(parsed)
        ? { library: { ...parsed, journeys: parsed.journeys.map(canonicalJourney) }, warning: '' }
        : {
            library: emptyLibrary(),
            warning: 'Saved journeys could not be read. Please check a new journey.',
          }
    }
    // Upgrade previous snapshots without marking any historical plan as started.
    const oldList = storage.getItem(legacyKeys[0])
    const oldSingle = storage.getItem(legacyKeys[1])
    const parsed: unknown = oldList ? JSON.parse(oldList) : oldSingle ? [JSON.parse(oldSingle)] : []
    if (!Array.isArray(parsed)) throw new Error('Invalid saved journeys')
    const journeys = parsed
      .map((item: unknown, index: number) =>
        isRecord(item) ? { ...item, id: `imported-${index}-${String(item.savedAt)}` } : item,
      )
      .filter(isSavedJourney)
      .slice(0, 3)
      .map(canonicalJourney)
    return { library: { version: 2, journeys, active: null }, warning: '' }
  } catch {
    return {
      library: emptyLibrary(),
      warning: 'Saved journeys could not be read. Saving may be unavailable in this browser.',
    }
  }
}
export function persistJourneyLibrary(
  library: JourneyLibrary,
  storage = browserJourneyStorage(),
): boolean {
  if (!storage || !isJourneyLibrary(library)) return false
  try {
    storage.setItem(journeyStorageKey, JSON.stringify(library))
    // The new, complete record is written before obsolete keys are removed.
    for (const key of legacyKeys) {
      try {
        storage.removeItem(key)
      } catch {
        /* New record remains authoritative. */
      }
    }
    return true
  } catch {
    return false
  }
}
export function sameJourneyInput(
  left: JourneyInput,
  right: JourneyInput,
  rightDeadlineAtMs?: number | null,
): boolean {
  const leftDeadlineAtMs = Date.parse(left.arriveBy)
  const retainedRightDeadlineAtMs = rightDeadlineAtMs ?? Date.parse(right.arriveBy)
  return (
    left.originName === right.originName &&
    left.destinationName === right.destinationName &&
    Number.isFinite(leftDeadlineAtMs) &&
    Number.isFinite(retainedRightDeadlineAtMs) &&
    leftDeadlineAtMs === retainedRightDeadlineAtMs &&
    left.safetyBufferMinutes === right.safetyBufferMinutes
  )
}
export function rememberJourney(library: JourneyLibrary, journey: SavedJourney): JourneyLibrary {
  journey = canonicalJourney(journey)
  const active = library.journeys.find((item) => item.id === library.active?.id)
  const recent = [
    journey,
    ...library.journeys.filter(
      (item) =>
        item.id !== journey.id &&
        item.id !== active?.id &&
        !sameJourneyInput(item.input, journey.input),
    ),
  ]
  return {
    ...library,
    journeys: [
      ...(active ? [active] : []),
      ...recent.filter((item) => item.id !== active?.id),
    ].slice(0, 3),
  }
}
export function startJourney(library: JourneyLibrary, id: string): JourneyLibrary {
  return library.journeys.some((item) => item.id === id)
    ? { ...library, active: { id, legIndex: 0 } }
    : library
}
export function endJourney(library: JourneyLibrary, expectedId: string): JourneyLibrary {
  return library.active?.id === expectedId ? { ...library, active: null } : library
}
export function setJourneyLeg(library: JourneyLibrary, legIndex: number): JourneyLibrary {
  const journey = library.journeys.find((item) => item.id === library.active?.id)
  if (
    !library.active ||
    !journey ||
    !Number.isInteger(legIndex) ||
    legIndex < 0 ||
    legIndex >= (journey.response.route?.legs.length ?? 0)
  )
    return library
  return { ...library, active: { ...library.active, legIndex } }
}
export function removeJourney(library: JourneyLibrary, id: string): JourneyLibrary {
  if (library.active?.id === id) return library // End protection explicitly first.
  return { ...library, journeys: library.journeys.filter((item) => item.id !== id) }
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
