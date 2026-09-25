import { ArrowUpRight, CheckCircle, MapTrifold, Question, WarningCircle, XCircle } from '@phosphor-icons/react'
import { useId, type CSSProperties, type ReactNode } from 'react'
import type { JourneyResponse } from '../types/journey'
import type { JourneyStatus } from '../types/journey'
import { displayDateTime, shortStation } from '../journeys/journey-presentation'
import { Button } from './ui'
import { getPrimaryRouteLineColor } from './route-flow'
import { useDialogSurface } from './useDialogSurface'

export function RouteDiagramDialog({
  route, checkedAt, status, statusLabel, statusTone, children,
}: {
  route: NonNullable<JourneyResponse['route']>
  checkedAt: string
  status: JourneyStatus
  statusLabel: string
  statusTone?: JourneyStatus | 'stale'
  children: ReactNode
}) {
  const { dialogRef: dialog, open: openSurface, close, finish } = useDialogSurface()
  const headingId = useId()
  function open() {
    const element = dialog.current
    if (!element) return
    openSurface()
    element.scrollTo({ top: 0, behavior: 'auto' })
  }
  const tone = statusTone ?? status
  const primaryRouteLineColor = getPrimaryRouteLineColor(route.legs)
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
            {route.legs.length} {route.legs.length === 1 ? 'route leg' : 'route legs'} · walks, changes and stops
          </span>
          <span className="route-diagram-trigger__status">
            <StatusIcon aria-hidden="true" size={17} weight="bold" />
            {statusLabel}
          </span>
        </span>
        <ArrowUpRight className="route-diagram-trigger__arrow" aria-hidden="true" size={21} weight="bold" />
      </Button>
      <dialog
        ref={dialog}
        className="route-diagram-dialog"
        aria-labelledby={headingId}
        style={
          primaryRouteLineColor
            ? ({ '--route-accent': primaryRouteLineColor } as CSSProperties)
            : undefined
        }
        onClose={() => finish()}
        onClick={(event) => { if (event.target === event.currentTarget) close() }}
      >
        <header className="route-diagram-dialog__header">
          <div>
            <h2 id={headingId}>How to get there</h2>
            <p>{shortStation(route.legs[0].from)} → {shortStation(route.legs[route.legs.length - 1].to)}</p>
          </div>
          <Button type="button" variant="secondary" autoFocus onClick={() => close()}>
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
