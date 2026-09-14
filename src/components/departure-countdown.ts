export const DEPARTURE_COUNTDOWN_WINDOW_SECONDS = 10 * 60

export type DepartureCountdownTone = 'watch' | 'urgent' | 'seconds'

export interface DepartureCountdownState {
  secondsRemaining: number
  tone: DepartureCountdownTone
}

/**
 * Returns a countdown only for the final ten minutes before a planned start.
 * This is a presentation aid for a provider estimate, not a live-service clock.
 */
export function getDepartureCountdown(
  departureAt: string,
  nowMs = Date.now(),
): DepartureCountdownState | null {
  const departureMs = Date.parse(departureAt)
  if (!Number.isFinite(departureMs) || !Number.isFinite(nowMs)) return null

  const remainingMs = departureMs - nowMs
  if (
    remainingMs <= 0 ||
    remainingMs > DEPARTURE_COUNTDOWN_WINDOW_SECONDS * 1000
  )
    return null

  const secondsRemaining = Math.ceil(remainingMs / 1000)

  return {
    secondsRemaining,
    tone: remainingMs < 60_000 ? 'seconds' : secondsRemaining < 180 ? 'urgent' : 'watch',
  }
}

export function departureAction(mode: string, lineName?: string) {
  if (mode === 'walk') return 'Start walking'
  if (mode === 'tube') return lineName ? `Catch the ${lineName} line` : 'Catch the Tube'
  if (mode === 'bus') return 'Catch the bus'
  if (mode === 'rail') return 'Catch the train'
  return 'Start this leg'
}
