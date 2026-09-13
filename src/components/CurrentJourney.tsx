import type { SavedJourney } from '../journeys/journey-store'
import {
  canonicalTubeStationName,
  displayDateTime,
  shortStation,
} from '../journeys/journey-presentation'
import { formatRouteDirectionText, formatRouteService, getRouteChange } from './route-flow'
import { Button, FormField, SelectControl } from './ui'
export function CurrentJourney({
  journey,
  legIndex,
  onLeg,
  onReplan,
  onEnd,
  onViewStep,
}: {
  journey: SavedJourney
  legIndex: number
  onLeg: (index: number) => void
  onReplan: (name: string) => void
  onEnd: () => void
  onViewStep: (target: string) => void
}) {
  const legs = journey.response.route!.legs
  const leg = legs[legIndex] ?? legs[0]
  const direction = formatRouteDirectionText(leg.directions, leg.instructions?.detailed)
  const change = legIndex > 0 ? getRouteChange(legs[legIndex - 1], leg) : undefined
  return (
    <section
      className="current-journey"
      aria-labelledby="current-step-title"
      tabIndex={-1}
      id="current-journey"
    >
      <div className="current-journey__notices">
        {change && (
          <div className="essential-notice" role="note">
            <strong>{change.title}</strong>
            <p>{change.description}</p>
          </div>
        )}
        {leg.notices?.map((notice) => (
          <p className="essential-notice" role="note" key={notice.kind + notice.text}>
            <strong>Before you travel: </strong>
            {notice.text}
          </p>
        ))}
      </div>
      <div className="current-journey__content">
        <div className="current-journey__context">
          <p className="eyebrow">Your journey · progress set by you</p>
          <h2 id="current-step-title">
            {leg.mode === 'walk'
              ? 'Walk to ' + shortStation(leg.to)
              : direction || formatRouteService(leg.mode, leg.lineName)}
          </h2>
          {leg.mode !== 'walk' && (
            <p className="current-journey__destination">
              <strong>Get off at {shortStation(leg.to)}</strong>
              {leg.stopCount !== undefined
                ? ' · ' +
                  leg.stopCount +
                  (leg.stopCount === 1 ? ' stop' : ' stops') +
                  ' in this leg'
                : ''}
            </p>
          )}
          <p className="route-timing-note">
            Saved plan, checked {displayDateTime(journey.response.checkedAt)}. This does not track
            your train or location.
          </p>
        </div>
        <div className="current-journey__controls" aria-label="Journey controls">
          <FormField
            label="Your current step"
            htmlFor="current-step"
            helpText="Update this when you reach the next leg."
          >
            <SelectControl
              id="current-step"
              value={legIndex}
              onChange={(event) => onLeg(Number(event.target.value))}
            >
              {legs.map((item, index) => (
                <option key={index} value={index}>
                  {index + 1}. {formatRouteService(item.mode, item.lineName)}:{' '}
                  {shortStation(item.from)} → {shortStation(item.to)}
                </option>
              ))}
            </SelectControl>
          </FormField>
          <div className="journey-actions" aria-label="Journey actions">
            <Button
              type="button"
              variant="primary"
              onClick={() => onViewStep((change ? 'route-change-' : 'route-leg-') + legIndex)}
            >
              View current step
            </Button>
            <Button
              type="button"
              variant="text"
              onClick={() =>
                onReplan(canonicalTubeStationName(leg.from) ?? shortStation(leg.from))
              }
            >
              Replan from here
            </Button>
            <Button type="button" variant="danger" onClick={onEnd}>
              End journey
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
