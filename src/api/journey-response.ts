import type { JourneyResponse } from '../types/journey.ts'

export function isJourneyResponse(value: unknown): value is JourneyResponse {
  if (!isRecord(value)) return false
  if (value.contractVersion !== 'journey-check.v0.2') return false
  if (
    !['viable', 'tight', 'not_viable', 'unable_to_verify'].includes(
      value.status as string,
    )
  ) {
    return false
  }
  if (!['fixture', 'live', 'cache'].includes(value.dataMode as string)) return false
  if (value.stationOnly !== true) return false
  if (
    typeof value.summary !== 'string' ||
    typeof value.nextAction !== 'string' ||
    typeof value.stationOnlyWarning !== 'string' ||
    typeof value.checkedAt !== 'string' ||
    !isDateString(value.checkedAt)
  ) {
    return false
  }
  if (!isRecord(value.deadline) || !isDateString(value.deadline.arriveBy)) return false
  if (!Array.isArray(value.evidence) || !Array.isArray(value.warnings)) return false
  if (!Array.isArray(value.reasons) || !value.reasons.every(isReason)) return false
  if (!value.evidence.every(isEvidenceItem)) return false
  if (!value.warnings.every((warning) => typeof warning === 'string')) return false
  if (value.route !== null && !isRoute(value.route)) return false
  return value.margin === null || isMargin(value.margin)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isEvidenceItem(value: unknown) {
  if (!isRecord(value)) return false
  return (
    typeof value.source === 'string' &&
    isDateString(value.capturedAt) &&
    (value.ageSeconds === null || isFiniteNonNegativeNumber(value.ageSeconds))
  )
}

function isReason(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.code === 'string' &&
    typeof value.message === 'string'
  )
}

function isRoute(value: unknown) {
  if (!isRecord(value) || !isDateString(value.arrivalAt)) return false
  if (
    value.walkingMinutes !== undefined &&
    !isFiniteNonNegativeNumber(value.walkingMinutes)
  ) {
    return false
  }
  if (value.fareWarning !== undefined && !isNonEmptyText(value.fareWarning)) {
    return false
  }
  if (value.alternativeRoute !== undefined && typeof value.alternativeRoute !== 'boolean') {
    return false
  }
  return (
    Array.isArray(value.legs) &&
    value.legs.every(isRouteLeg) &&
    isOptionalAlternatives(value.alternatives)
  )
}

function isRouteLeg(value: unknown) {
  if (!isRecord(value)) return false
  return (
    typeof value.mode === 'string' &&
    typeof value.from === 'string' &&
    typeof value.to === 'string' &&
    isDateString(value.departureAt) &&
    isDateString(value.arrivalAt) &&
    isFiniteNonNegativeNumber(value.durationMinutes) &&
    (value.lineName === undefined || typeof value.lineName === 'string') &&
    isOptionalStopPointId(value.fromTflStopPointId) &&
    isOptionalStopPointId(value.toTflStopPointId) &&
    isOptionalTextList(value.directions) &&
    isOptionalSchedule(value.scheduledDepartureAt, value.scheduledArrivalAt) &&
    isOptionalInstructions(value.instructions) &&
    isOptionalNotices(value.notices)
  )
}

function isOptionalStopPointId(value: unknown) {
  return value === undefined || isNonEmptyText(value)
}

function isOptionalTextList(value: unknown) {
  return (
    value === undefined ||
    (Array.isArray(value) &&
      value.length > 0 &&
      value.every((item) => typeof item === 'string' && item.trim() !== ''))
  )
}

function isOptionalSchedule(departureAt: unknown, arrivalAt: unknown) {
  if (
    (departureAt !== undefined && !isDateString(departureAt)) ||
    (arrivalAt !== undefined && !isDateString(arrivalAt))
  ) {
    return false
  }
  if (departureAt === undefined || arrivalAt === undefined) return true
  return Date.parse(arrivalAt as string) >= Date.parse(departureAt as string)
}

function isOptionalInstructions(value: unknown) {
  if (value === undefined) return true
  if (!isRecord(value)) return false

  const hasSummary = value.summary !== undefined
  const hasDetailed = value.detailed !== undefined
  const hasSteps = value.steps !== undefined
  if (!hasSummary && !hasDetailed && !hasSteps) return false

  return (
    (!hasSummary || isNonEmptyText(value.summary)) &&
    (!hasDetailed || isNonEmptyText(value.detailed)) &&
    (!hasSteps || isOptionalTextList(value.steps))
  )
}

function isOptionalNotices(value: unknown) {
  return (
    value === undefined ||
    (Array.isArray(value) && value.length > 0 && value.every(isNotice))
  )
}

function isNotice(value: unknown) {
  if (!isRecord(value)) return false
  return (
    (value.kind === 'disruption' || value.kind === 'planned_work') &&
    typeof value.text === 'string' &&
    value.text.trim() !== '' &&
    value.text.length <= 240
  )
}

function isOptionalAlternatives(value: unknown) {
  return (
    value === undefined ||
    (Array.isArray(value) && value.length > 0 && value.every(isAlternative))
  )
}

function isAlternative(value: unknown) {
  if (!isRecord(value)) return false
  return (
    typeof value.departureAt === 'string' &&
    typeof value.arrivalAt === 'string' &&
    isDateString(value.departureAt) &&
    isDateString(value.arrivalAt) &&
    Date.parse(value.arrivalAt) >= Date.parse(value.departureAt) &&
    isFiniteNonNegativeNumber(value.durationMinutes) &&
    (value.walkingMinutes === undefined ||
      isFiniteNonNegativeNumber(value.walkingMinutes)) &&
    isFiniteNumber(value.remainingAfterBufferMinutes) &&
    Array.isArray(value.segments) &&
    value.segments.length > 0 &&
    value.segments.every(isAlternativeSegment)
  )
}

function isAlternativeSegment(value: unknown) {
  return (
    isRecord(value) &&
    isNonEmptyText(value.mode) &&
    (value.lineName === undefined || isNonEmptyText(value.lineName))
  )
}

function isNonEmptyText(value: unknown) {
  return typeof value === 'string' && value.trim() !== ''
}

function isMargin(value: unknown) {
  if (!isRecord(value)) return false
  return (
    isDateString(value.arrivalAt) &&
    isFiniteNonNegativeNumber(value.transferMinutes) &&
    isFiniteNonNegativeNumber(value.safetyBufferMinutes) &&
    isFiniteNumber(value.availableMinutes) &&
    typeof value.remainingAfterBufferMinutes === 'number' &&
    Number.isFinite(value.remainingAfterBufferMinutes)
  )
}

function isDateString(value: unknown) {
  if (typeof value !== 'string') return false
  const match = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.exec(value)
  if (match === null) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!isCalendarDate(year, month, day)) return false
  return !Number.isNaN(Date.parse(value))
}

function isCalendarDate(year: number, month: number, day: number) {
  if (month < 1 || month > 12 || day < 1) return false
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ][month - 1]
  return daysInMonth !== undefined && day <= daysInMonth
}

function isFiniteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
}

function isFiniteNonNegativeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}
