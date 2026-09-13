import { ArrowUpRight, CheckCircle, MapTrifold, Question, WarningCircle, XCircle } from '@phosphor-icons/react'
import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react'
import type { JourneyResponse } from '../types/journey'
import type { JourneyStatus } from '../types/journey'
import { displayDateTime, shortStation } from '../journeys/journey-presentation'
import { Button } from './ui'

export function RouteDiagramDialog({
  route, checkedAt, status, statusLabel, statusTone, request, onClose, children,
}: {
  route: NonNullable<JourneyResponse['route']>
  checkedAt: string
  status: JourneyStatus
  statusLabel: string
  statusTone?: JourneyStatus | 'stale'
  request?: { target: string }
  onClose?: () => void
  children: ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const headingId = useId()
  const previousOverflow = useRef<string | null>(null)
  const unlock = useCallback(() => {
    if (previousOverflow.current !== null) {
      document.body.style.overflow = previousOverflow.current
      previousOverflow.current = null
    }
  }, [])
  const open = useCallback((target?: string) => {
    const element = dialog.current
    if (!element || element.open) return
    previousOverflow.current = document.body.style.overflow
    element.showModal()
    document.body.style.overflow = 'hidden'
    const step = target ? element.querySelector<HTMLElement>('#' + target) : null
    if (step) {
      step.scrollIntoView({ block: 'start' })
      step.focus({ preventScroll: true })
    } else {
      element.scrollTop = 0
    }
  }, [])
  useEffect(() => {
    if (request) open(request.target)
  }, [request, open])
  useEffect(() => unlock, [unlock])
  const tone = statusTone ?? status
  const StatusIcon = tone === 'viable'
    ? CheckCircle
    : tone === 'tight' || tone === 'stale'
      ? WarningCircle
      : tone === 'not_viable'
        ? XCircle
        : Question
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className={`route-diagram-trigger route-diagram-trigger--${tone}`}
        aria-haspopup="dialog"
        onClick={() => open()}
      >
        <MapTrifold className="route-diagram-trigger__map-icon" aria-hidden="true" size={25} weight="bold" />
        <span className="route-diagram-trigger__copy">
          <strong>View route steps</strong>
          <span className="route-diagram-trigger__meta">
            {route.legs.length} {route.legs.length === 1 ? 'route leg' : 'route legs'} · walking + Tube details
          </span>
          <span className="route-diagram-trigger__status">
            <StatusIcon aria-hidden="true" size={17} weight="bold" />
            {statusLabel}
          </span>
        </span>
        <ArrowUpRight className="route-diagram-trigger__arrow" aria-hidden="true" size={21} weight="bold" />
      </Button>
      <dialog ref={dialog} className="route-diagram-dialog" aria-labelledby={headingId} onClose={() => { unlock(); onClose?.() }}>
        <header className="route-diagram-dialog__header">
          <div>
            <h2 id={headingId}>How to get there</h2>
            <p>{shortStation(route.legs[0].from)} → {shortStation(route.legs[route.legs.length - 1].to)}</p>
          </div>
          <Button type="button" variant="secondary" autoFocus onClick={() => dialog.current?.close()}>
            Close <span aria-hidden="true">×</span>
          </Button>
        </header>
        <div className="route-diagram-dialog__body">
          <p className="route-timing-note">
            Step-by-step route diagram · Saved plan checked {displayDateTime(checkedAt)}.
            Times are estimates; follow station signs and current advice.
          </p>
          {route.fareWarning && <p className="route-fare-warning">{route.fareWarning}</p>}
          {children}
        </div>
      </dialog>
    </>
  )
}
