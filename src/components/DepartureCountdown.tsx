import { departureAction, getDepartureCountdown } from './departure-countdown'
import { useDisplayClock } from './useDisplayClock'

interface DepartureCountdownProps {
  departureAt: string
  mode: string
  lineName?: string
}

function formatRemaining(secondsRemaining: number, showSeconds: boolean) {
  if (showSeconds) {
    return `${secondsRemaining} second${secondsRemaining === 1 ? '' : 's'}`
  }
  const minutes = Math.ceil(secondsRemaining / 60)
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}

/** A reusable local countdown for the final minutes before a planned leg. */
export function DepartureCountdown({ departureAt, mode, lineName }: DepartureCountdownProps) {
  const now = useDisplayClock(1_000)
  const countdown = getDepartureCountdown(departureAt, now)
  if (!countdown) return null

  const action = departureAction(mode, lineName)
  const urgency = countdown.tone === 'watch' ? 'Planned start' : 'Leave now'

  return (
    <aside
      className={`departure-countdown departure-countdown--${countdown.tone}`}
      aria-label="Departure countdown"
      aria-live="off"
    >
      <p className="departure-countdown__eyebrow">Departure countdown</p>
      <p className="departure-countdown__value">
        <strong>{urgency}</strong> · {action} in {formatRemaining(countdown.secondsRemaining, countdown.tone === 'seconds')}
      </p>
      <p className="departure-countdown__note">
        Based on the planned estimate, not live vehicle movement.
      </p>
    </aside>
  )
}
