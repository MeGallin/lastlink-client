import type { JourneyResponse } from '../types/journey'
import type { JourneyInput, SavedJourney } from './journey-store'
import { findStationByName } from '../data/stations.ts'
import { parseLocalDateTimeValue } from '../components/journey-time.ts'

export function shortStation(name: string) {
  return name.replace(/ Underground Station$/i, '')
}
export function canonicalTubeStationName(name: string) {
  return findStationByName(name)?.name ?? findStationByName(shortStation(name))?.name ?? null
}
export function minutes(value: number) {
  return `${value} ${Math.abs(value) === 1 ? 'minute' : 'minutes'}`
}
export function displayTime(value: string) {
  return Number.isFinite(Date.parse(value))
    ? new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/London',
      }).format(new Date(value))
    : 'Time unavailable'
}
export function displayDateTime(value: string) {
  return Number.isFinite(Date.parse(value))
    ? new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Europe/London',
      }).format(new Date(value))
    : 'Time unavailable'
}
export function routeName(input: JourneyInput) {
  return `${input.originName} → ${input.destinationName}`
}
export function routeServices(response: JourneyResponse) {
  return [
    ...new Set(
      response.route?.legs.map((leg) => leg.lineName || (leg.mode === 'walk' ? 'Walk' : leg.mode)),
    ),
  ].join(' → ')
}
export function isSavedJourneyStale(
  journey: Pick<SavedJourney, 'input' | 'response'>,
  now = Date.now(),
) {
  const deadlineAt = Date.parse(journey.input.arriveBy)
  const departureAt = Date.parse(journey.response.route?.legs[0]?.departureAt ?? '')
  return (
    (Number.isFinite(deadlineAt) && deadlineAt <= now) ||
    (Number.isFinite(departureAt) && departureAt <= now)
  )
}
export function validateJourneyInput(
  input: JourneyInput,
  now = Date.now(),
  deadlineAtMs?: number,
): { message: string; field: string } | null {
  if (!input.originName.trim()) return { message: 'Add a starting point.', field: 'origin' }
  if (input.originName.trim().length > 120)
    return { message: 'Keep the starting point under 120 characters.', field: 'origin' }
  const origin = findStationByName(input.originName.trim())
  if (!origin)
    return {
      message: 'Choose a starting point from the Tube station suggestions.',
      field: 'origin',
    }
  const destination = findStationByName(input.destinationName)
  if (!destination)
    return {
      message: 'Choose a destination from the Tube station suggestions.',
      field: 'destination',
    }
  if (findStationByName(input.originName.trim())?.id === destination.id)
    return {
      message:
        'Your starting point and destination are the same. Choose a different destination station.',
      field: 'destination',
    }
  const arriveByAtMs = deadlineAtMs ?? parseLocalDateTimeValue(input.arriveBy, now)
  if (arriveByAtMs === undefined)
    return { message: 'Add a valid arrival time.', field: 'arriveBy' }
  if (arriveByAtMs <= now)
    return {
      message:
        'That arrival deadline has passed. Review the time below; your existing plan is unchanged.',
      field: 'arriveBy',
    }
  return null
}
export function explainUnverified(response: JourneyResponse): string {
  const codes = response.reasons.map((item) => item.code)
  if (codes.includes('DEADLINE_MISSED'))
    return (
      response.summary + ' Review your starting point and arrival deadline before planning again.'
    )
  if (codes.includes('PROVIDER_RATE_LIMITED'))
    return 'TfL is receiving too many requests. Wait a little, then try again.'
  if (codes.includes('TIME_AMBIGUOUS'))
    return 'The journey time could not be resolved reliably. Review the date and time.'
  if (codes.includes('PROVIDER_UNAVAILABLE'))
    return 'TfL could not complete this check. Try again shortly.'
  if (codes.includes('NO_MATCHING_ROUTE'))
    return 'TfL did not return a matching route for these stations. Review your stations and arrival deadline.'
  return 'There is not enough reliable information to verify this journey. Review the details or try again.'
}
