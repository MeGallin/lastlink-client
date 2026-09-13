export function toLocalDateTimeValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function minuteStart(now: Date) {
  return Math.floor(now.getTime() / 60_000) * 60_000
}

export function parseLocalDateTimeValue(value: string, now = Date.now()) {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return undefined
  if (/Z$|[+-]\d\d:\d\d$/.test(value)) return parsed
  const candidates = [parsed - 60 * 60_000, parsed, parsed + 60 * 60_000].filter(
    (candidate, index, values) =>
      values.indexOf(candidate) === index &&
      toLocalDateTimeValue(new Date(candidate)) === value,
  )
  if (candidates.length === 0) return undefined
  const future = candidates.filter((candidate) => candidate > now)
  return future.length > 0 ? Math.min(...future) : Math.max(...candidates)
}

export function nowLocalDateTimeValue(now = new Date()) {
  return toLocalDateTimeValue(new Date(minuteStart(now)))
}

export function earliestFutureDateTimeValue(now = new Date()) {
  return toLocalDateTimeValue(new Date(minuteStart(now) + 60_000))
}

export function defaultArriveByInstant(now = new Date()) {
  return new Date(minuteStart(now) + 60 * 60_000)
}

export function defaultArriveBy(now = new Date()) {
  return toLocalDateTimeValue(defaultArriveByInstant(now))
}

export interface DeadlinePreset {
  label: string
  value: string
  atMs: number
}

export function futureDeadlinePresets(now = new Date()): DeadlinePreset[] {
  const base = new Date(minuteStart(now))

  const inMinutes = (minutes: number) => {
    const date = new Date(base.getTime() + minutes * 60_000)
    return { value: toLocalDateTimeValue(date), atMs: date.getTime() }
  }

  const tomorrow = new Date(base)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)

  return [
    { label: 'In 30 minutes', ...inMinutes(30) },
    { label: 'In 1 hour', ...inMinutes(60) },
    { label: 'Tomorrow at 09:00', value: toLocalDateTimeValue(tomorrow), atMs: tomorrow.getTime() },
  ]
}

export function toDeadlineIso(value: string, instantMs?: number) {
  const parsed = instantMs ?? parseLocalDateTimeValue(value)
  const date = new Date(parsed ?? Number.NaN)
  if (!Number.isFinite(date.getTime())) throw new Error('deadline must be finite')
  return date.toISOString()
}
