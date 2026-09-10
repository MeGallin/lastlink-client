import { Fragment, type CSSProperties, type RefObject } from 'react'
import { ArrowsDownUp, Bus, PersonSimpleWalk, Question, Subway, Train } from '@phosphor-icons/react'
import type { JourneyResponse, JourneyStatus } from '../types/journey'
import {
  formatJourneyDuration,
  formatLineName,
  formatRouteDirectionText,
  formatRouteService,
  getRouteChange,
  getLineColor,
  getRouteDisplayMode,
  getRouteIconKind,
  providerScheduleMatchesItinerary,
} from './route-flow'

interface JourneyAnswerProps {
  response: JourneyResponse
  answerRef?: RefObject<HTMLElement | null>
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

function formatTimingDate(departureAt: string, arrivalAt: string) {
  const departureDate = formatDate(departureAt)
  const arrivalDate = formatDate(arrivalAt)
  return departureDate === arrivalDate
    ? departureDate
    : `${departureDate} to ${arrivalDate}`
}

function formatStatus(status: JourneyStatus) {
  return {
    viable: 'Looks viable',
    tight: 'Tight margin',
    not_viable: 'Not viable',
    unable_to_verify: 'Unable to verify',
  }[status]
}

function formatEvidenceAge(ageSeconds: number | null) {
  if (ageSeconds === null) return 'age unavailable'
  if (ageSeconds < 60) return 'less than a minute old'
  const minutes = Math.round(ageSeconds / 60)
  return `${minutes} minute${minutes === 1 ? '' : 's'} old`
}

function formatEvidenceSource(source: string) {
  return source
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/^Tfl\b/, 'TfL')
}

function RouteLegIcon({ mode, lineName }: { mode: string; lineName?: string }) {
  switch (getRouteIconKind(mode, lineName)) {
    case 'walk':
      return <PersonSimpleWalk aria-hidden="true" size={26} weight="regular" />
    case 'tube':
      return <Subway aria-hidden="true" size={26} weight="regular" />
    case 'bus':
      return <Bus aria-hidden="true" size={26} weight="regular" />
    case 'rail':
      return <Train aria-hidden="true" size={26} weight="regular" />
    default:
      return <Question aria-hidden="true" size={26} weight="regular" />
  }
}

export function JourneyAnswer({ response, answerRef }: JourneyAnswerProps) {
  const route = response.route

  return (
    <section
      ref={answerRef}
      className={`answer answer-${response.status}`}
      aria-labelledby="answer-title"
      aria-live="polite"
      tabIndex={-1}
    >
      <div className="answer-heading">
        <div>
          <p className="eyebrow">Your answer</p>
          <h2 id="answer-title">{formatStatus(response.status)}</h2>
        </div>
        <span className={`data-mode data-mode-${response.dataMode}`}>
          {response.dataMode} data
        </span>
      </div>
      <p className="answer-summary">{response.summary}</p>

      {route && route.legs.length > 0 && (
        <div className="route-summary">
          <div className="route-heading">
            <strong>How to get there</strong>
            <div className="route-heading-meta">
              <span>{route.walkingMinutes ?? 0} minutes walking</span>
              <span className="route-total">
                Estimated total{' '}
                <strong>
                  {formatJourneyDuration(route.legs[0]?.departureAt ?? '', route.arrivalAt)}
                </strong>
              </span>
            </div>
          </div>
          <p className="route-timing-note">
            Times are from the TfL Journey Planner itinerary. They are not live
            vehicle observations.
          </p>
          {route.fareWarning && (
            <p className="route-fare-warning" role="note">
              {route.fareWarning}
            </p>
          )}
          <ol className="route-flow" aria-label="Journey route">
            {route.legs.map((leg, index) => {
              const previousLeg = route.legs[index - 1]
              const routeChange = previousLeg
                ? getRouteChange(previousLeg, leg)
                : undefined
              const lineColor = getLineColor(leg.lineName)
              const displayMode = getRouteDisplayMode(leg.mode, leg.lineName)
              const hasScheduledTiming =
                leg.scheduledDepartureAt !== undefined ||
                leg.scheduledArrivalAt !== undefined
              const hasInstructions = leg.instructions !== undefined
              const directionText = formatRouteDirectionText(
                leg.directions,
                leg.instructions?.detailed,
              )
              const instructionText =
                leg.instructions?.detailed ?? leg.instructions?.summary
              const showStationInstructions = displayMode === 'walk' && hasInstructions
              const scheduleMatchesItinerary = providerScheduleMatchesItinerary(
                leg.departureAt,
                leg.arrivalAt,
                leg.scheduledDepartureAt,
                leg.scheduledArrivalAt,
              )
              return (
                <Fragment key={`${leg.departureAt}-${leg.arrivalAt}-${leg.from}`}>
                  {routeChange && (
                    <li className={`route-flow__change route-flow__change--${routeChange.kind}`}>
                      <div className="route-flow__change-marker" aria-hidden="true">
                        <ArrowsDownUp size={22} weight="bold" />
                      </div>
                      <div className="route-flow__change-detail">
                        <strong>{routeChange.title}</strong>
                        <p>{routeChange.description}</p>
                        {routeChange.nextDirection && (
                          <p className="route-change-next">
                            <span>Next train</span> {routeChange.nextDirection}
                          </p>
                        )}
                      </div>
                    </li>
                  )}
                  <li
                    className={`route-flow__step route-flow__step--${displayMode}`}
                    style={{ '--route-line-color': lineColor } as CSSProperties}
                  >
                    <div className="route-flow__visual" aria-hidden="true">
                      <span className="route-flow__icon">
                        <RouteLegIcon mode={leg.mode} lineName={leg.lineName} />
                      </span>
                      {index < route.legs.length - 1 && (
                        <span className="route-flow__connector" />
                      )}
                    </div>
                    <div className="route-flow__detail">
                    <div className="route-step-heading">
                      <div className="route-step-mode">
                        <strong>{formatRouteService(leg.mode, leg.lineName)}</strong>
                        {displayMode === 'tube' && leg.lineName && (
                          <span
                            className="route-line-key"
                            role="img"
                            aria-label={`${formatLineName(leg.lineName)} colour`}
                          />
                        )}
                      </div>
                      <span>{leg.durationMinutes} minutes</span>
                    </div>
                    <p>
                      {leg.from} <span aria-hidden="true">→</span> {leg.to}
                    </p>
                    {displayMode !== 'walk' && directionText && (
                      <p className="route-step-direction">
                        <span>Direction</span>{' '}
                        {directionText}
                      </p>
                    )}
                    {displayMode !== 'walk' && !directionText && instructionText && (
                      <p className="route-step-instruction">
                        <span>Instruction</span> {instructionText}
                      </p>
                    )}
                    <div className="route-step-times">
                      <div className="route-step-timing">
                        <span className="route-step-time-label">Expected journey</span>
                        <span className="route-step-time-value">
                          <span>
                            <strong>Leave</strong>{' '}
                            <time dateTime={leg.departureAt}>
                              {formatTime(leg.departureAt)}
                            </time>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            <strong>Arrive</strong>{' '}
                            <time dateTime={leg.arrivalAt}>
                              {formatTime(leg.arrivalAt)}
                            </time>
                          </span>
                        </span>
                        <small className="route-step-time-note">
                          {formatTimingDate(leg.departureAt, leg.arrivalAt)} · TfL Journey Planner estimate
                        </small>
                      </div>
                      {hasScheduledTiming && !scheduleMatchesItinerary && (
                        <div className="route-step-timing route-step-timing--schedule">
                          <span className="route-step-time-label">Published schedule</span>
                          <span className="route-step-time-value">
                            <span>
                              <strong>Scheduled</strong>{' '}
                              {leg.scheduledDepartureAt ? (
                                <time dateTime={leg.scheduledDepartureAt}>
                                  {formatTime(leg.scheduledDepartureAt)}
                                </time>
                              ) : (
                                'departure not supplied'
                              )}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {leg.scheduledArrivalAt ? (
                                <time dateTime={leg.scheduledArrivalAt}>
                                  {formatTime(leg.scheduledArrivalAt)}
                                </time>
                              ) : (
                                'arrival not supplied'
                              )}
                            </span>
                          </span>
                          <small className="route-step-time-note">
                            {leg.scheduledDepartureAt && leg.scheduledArrivalAt
                              ? `${formatTimingDate(leg.scheduledDepartureAt, leg.scheduledArrivalAt)} · provider timing, not a live update`
                              : 'The provider supplied only part of the schedule.'}
                          </small>
                        </div>
                      )}
                      {hasScheduledTiming && scheduleMatchesItinerary && (
                        <small className="route-step-time-note route-step-time-note--schedule">
                          {formatTimingDate(leg.scheduledDepartureAt!, leg.scheduledArrivalAt!)} · provider schedule matches this plan; not a live update
                        </small>
                      )}
                    </div>
                    {showStationInstructions && (
                      <details className="route-step-instructions">
                        <summary>Show station instructions</summary>
                        <div className="route-step-instructions__content">
                          {leg.instructions?.summary && (
                            <strong>{leg.instructions.summary}</strong>
                          )}
                          {leg.instructions?.detailed && (
                            <p>{leg.instructions.detailed}</p>
                          )}
                          {leg.instructions?.steps && (
                            <ol>
                              {leg.instructions.steps.map((step) => (
                                <li key={step}>{step}</li>
                              ))}
                            </ol>
                          )}
                        </div>
                      </details>
                    )}
                    </div>
                  </li>
                </Fragment>
              )
            })}
          </ol>
        </div>
      )}

      {response.margin && route && (
        <dl className="answer-facts">
          <div>
            <dt>Expected arrival</dt>
          <dd>{formatDateTime(route.arrivalAt)}</dd>
          </div>
          <div>
            <dt>Margin after buffer</dt>
            <dd>{Math.round(response.margin.remainingAfterBufferMinutes)} minutes</dd>
          </div>
          <div>
            <dt>Checked</dt>
            <dd>{formatDateTime(response.checkedAt)}</dd>
          </div>
        </dl>
      )}

      <div className="next-action">
        <strong>Next action</strong>
        <p>{response.nextAction}</p>
      </div>

      <p className="station-only-note">{response.stationOnlyWarning}</p>

      {response.evidence.length > 0 && (
        <div className="evidence-list">
          <strong>Evidence freshness</strong>
          <ul>
            {response.evidence.map((item) => (
              <li key={`${item.source}-${item.capturedAt}`}>
                <span>{formatEvidenceSource(item.source)}</span>
                <small>{formatEvidenceAge(item.ageSeconds)}</small>
              </li>
            ))}
          </ul>
        </div>
      )}

      {response.warnings.length > 0 && (
        <div className="warning-list">
          <strong>Keep in mind</strong>
          <ul>
            {response.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
