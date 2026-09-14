import { useEffect, useState, type CSSProperties } from 'react'
import type { SavedJourney } from '../journeys/journey-store'
import {
  displayDateTime,
  isSavedJourneyStale,
  routeName,
  routeServices,
} from '../journeys/journey-presentation'
import { getPrimaryRouteLineColor } from '../components/route-flow'
import { AppLink, Button } from '../components/ui'

export function SavedItemsView({
  journeys,
  activeId,
  onResume,
  onReview,
  onPlanReturn,
  onRemove,
  onEnd,
}: {
  journeys: SavedJourney[]
  activeId: string | null
  onResume: (journey: SavedJourney) => void
  onReview: (journey: SavedJourney) => void
  onPlanReturn: (journey: SavedJourney) => void
  onRemove: (journey: SavedJourney) => void
  onEnd: (journey: SavedJourney) => void
}) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  return (
    <section className="page-card saved-routes-page" aria-labelledby="saved-routes-title">
      <div className="page-heading">
        <p className="eyebrow">On this browser and device</p>
        <h1 id="saved-routes-title" tabIndex={-1}>
          Saved journeys
        </h1>
        <p>
          Up to three plans. A started journey is protected; other checks replace the oldest recent
          plan.
        </p>
      </div>
      {journeys.length === 0 ? (
        <div className="empty-state">
          <h2>No saved journeys yet</h2>
          <p>A returned itinerary is saved automatically when device storage is available.</p>
          <AppLink variant="primary" href="#/">
            Plan a journey
          </AppLink>
        </div>
      ) : (
        <>
          <p className="saved-routes-count">
            {journeys.length} of 3 saved ·{' '}
            {activeId ? '1 protected journey, up to 2 recent checks' : 'No journey started'}
          </p>
          <ul className="saved-routes-list">
            {journeys.map((journey) => {
              const current = journey.id === activeId
              const stale = isSavedJourneyStale(journey, now)
              const routeAccent = getPrimaryRouteLineColor(journey.response.route?.legs)
              return (
                <li
                  key={journey.id}
                  className={'saved-route' + (journey.id === activeId ? ' saved-route--current' : '')}
                  style={
                    routeAccent
                      ? ({ '--saved-route-accent': routeAccent } as CSSProperties)
                      : undefined
                  }
                >
                  <div className="saved-route__main">
                    <div className="saved-route__heading">
                      <p className="eyebrow">
                        {journey.id === activeId
                          ? 'Current journey · protected'
                          : 'Recent check · not started'}
                      </p>
                      {stale && (
                        <span
                          className="saved-route__freshness-badge"
                          aria-label="This saved plan needs a fresh check"
                        >
                          Needs fresh check
                        </span>
                      )}
                    </div>
                    <strong>{routeName(journey.input)}</strong>
                    <p>{routeServices(journey.response)}</p>
                    <p className="saved-route__freshness">
                      {stale
                        ? 'This plan is old or its planned start has passed. Review the deadline before checking again.'
                        : 'Saved at the last check. Recheck before travel if conditions have changed.'}
                    </p>
                    <small>
                      Deadline {displayDateTime(journey.input.arriveBy)} ·{' '}
                      {journey.input.safetyBufferMinutes}-minute margin
                    </small>
                    <small>
                      Expected arrival {displayDateTime(journey.response.route!.arrivalAt)}
                    </small>
                    <small>
                      Checked {displayDateTime(journey.response.checkedAt)} · not refreshed
                    </small>
                  </div>
                  <div className="saved-route__actions">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => current || !stale ? onResume(journey) : onReview(journey)}
                    >
                      {current ? 'Resume journey' : stale ? 'Review and recheck' : 'Open saved plan'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="saved-route__return-action"
                      onClick={() => onPlanReturn(journey)}
                    >
                      Plan return journey
                    </Button>
                    <Button
                      type="button"
                      variant="text"
                      onClick={() => (journey.id === activeId ? onEnd(journey) : onRemove(journey))}
                    >
                      {journey.id === activeId ? 'End journey' : 'Remove'}
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
      <p className="saved-routes-storage-note">
        Saved plans are references, not live tracking. They are not synced to an account. Clearing
        browser data removes them.
      </p>
    </section>
  )
}
