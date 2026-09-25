import type { CSSProperties } from 'react'
import type { JourneyResponse } from '../types/journey'
import { minutes, shortStation } from '../journeys/journey-presentation'
import { formatRouteDirectionText, formatRouteService, getLineColor } from './route-flow'
import { RouteLegIcon } from './RouteLegIcon'

type JourneyLeg = NonNullable<JourneyResponse['route']>['legs'][number]

/** The same provider-backed travel cue is used before setting off and between legs. */
export function JourneyLegSummary({ leg, label }: { leg: JourneyLeg; label: string }) {
  const walking = leg.mode === 'walk'
  const direction = formatRouteDirectionText(leg.directions, leg.instructions?.detailed)
  return (
    <div className="journey-leg-summary" style={{ '--route-line-color': getLineColor(leg.lineName) } as CSSProperties}>
      <span className="journey-leg-summary__icon"><RouteLegIcon mode={leg.mode} lineName={leg.lineName} /></span>
      <div>
        <span className="journey-leg-summary__label">{label}</span>
        <strong>{walking ? `Walk to ${shortStation(leg.to)}` : direction || formatRouteService(leg.mode, leg.lineName)}</strong>
        <p>
          {walking ? `From ${shortStation(leg.from)}` : `${shortStation(leg.from)} → ${shortStation(leg.to)}`}
          {' · '}{minutes(leg.durationMinutes)}
          {leg.stopCount !== undefined && ` · ${leg.stopCount} ${leg.stopCount === 1 ? 'stop' : 'stops'}`}
        </p>
      </div>
    </div>
  )
}
