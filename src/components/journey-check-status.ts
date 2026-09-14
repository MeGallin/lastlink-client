import type { JourneyInput } from '../journeys/journey-store'
import { routeName } from '../journeys/journey-presentation'

export const wakeNoticeDelayMs = 4_000

export function pendingJourneyCopy(pending: JourneyInput) {
  const name = routeName(pending)
  return {
    checking: `Checking TfL: ${name}…`,
    wakingHeading: 'This is taking longer than usual',
    wakingBody: `The service may be waking after inactivity. Keep this page open while we finish checking ${name}.`,
  }
}

export function scheduleWakeNotice(onWake: () => void) {
  const timer = window.setTimeout(onWake, wakeNoticeDelayMs)
  return () => window.clearTimeout(timer)
}
