import { Fragment, type CSSProperties, type RefObject } from 'react'
import { ArrowsDownUp, Bus, PersonSimpleWalk, Question, Subway, Train } from '@phosphor-icons/react'
import type { JourneyResponse, JourneyStatus } from '../types/journey'
import { EvidenceAge } from './EvidenceAge'
import { TubeStationSequence } from './TubeStationSequence'
import { useDisplayClock } from './useDisplayClock'
import {
  formatJourneyDuration,
  formatAlternativeMargin,
  formatAlternativeServices,
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
  const now = useDisplayClock()
  const departure = Date.parse(route?.legs[0]?.departureAt ?? '')
  const needsRecheck = (response.status === 'viable' || response.status === 'tight') && now > departure

  return (
    <section
      ref={answerRef}
      className={`answer answer-${needsRecheck ? 'unable_to_verify' : response.status}`}
      aria-labelledby="answer-title"
      aria-live="polite"
      tabIndex={-1}
    >
      <div className="answer-heading">
        <div>
          <p className="eyebrow">Assessment at last check</p>
          <h2 id="answer-title">{needsRecheck ? 'Recheck before starting' : formatStatus(response.status)}</h2>
        </div>
        <span className={`data-mode data-mode-${response.dataMode}`}>
          {response.dataMode} data
        </span>
      </div>
      {needsRecheck && <p className="answer-summary">The planned start time has passed. If you have not started, check a new route. If you are already travelling, this itinerary remains available as a reference.</p>}
      <p className={needsRecheck ? 'route-timing-note' : 'answer-summary'}>{needsRecheck && 'At the last check: '}{response.summary}</p>
      <p className="route-timing-note">This is a saved assessment. Times and service conditions are not refreshed automatically.</p>
      <button type="submit" form="journey-check-form">Check journey again</button>
      <p className="route-timing-note">Uses the stations, deadline and safety margin currently entered in the form.</p>

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
          {route.alternativeRoute && (
            <p className="route-selection-note" role="note">
              TfL supplied this as an alternative itinerary. The assessment above
              explains whether it meets your requirements.
            </p>
          )}
          {route.alternatives && route.alternatives.length > 0 && (
            <details className="route-alternatives">
              <summary>Other routes found ({route.alternatives.length})</summary>
              <p>Compare these itinerary summaries. The assessment above applies to the detailed route below.</p>
              <ul>
                {route.alternatives.map((alternative, index) => (
                  <li
                    key={`${alternative.departureAt}-${alternative.arrivalAt}-${index}`}
                  >
                    <div className="route-alternative-heading">
                      <strong>{formatAlternativeServices(alternative.segments)}</strong>
                      <span>{alternative.durationMinutes} minutes total</span>
                    </div>
                    <p>
                      Leave {formatTime(alternative.departureAt)} · arrive{' '}
                      {formatTime(alternative.arrivalAt)} ·{' '}
                      {formatAlternativeMargin(alternative.remainingAfterBufferMinutes)}
                    </p>
                    <p>{formatTimingDate(alternative.departureAt, alternative.arrivalAt)} · TfL Journey Planner estimate</p>
                    <p>{alternative.walkingMinutes === undefined
                      ? 'Walking time not supplied'
                      : `Includes ${alternative.walkingMinutes} ${alternative.walkingMinutes === 1 ? 'minute' : 'minutes'} walking`}</p>
                  </li>
                ))}
              </ul>
            </details>
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
              const noticeCount = leg.notices?.length ?? 0
              const hasServiceNotices = noticeCount > 0
              const serviceDetails = (
                <>
                  {leg.notices?.map((notice) => (
                    <p
                      className={`route-step-notice route-step-notice--${notice.kind}`}
                      key={`${notice.kind}-${notice.text}`}
                      role="note"
                    >
                      <strong>
                        {notice.kind === 'planned_work'
                          ? 'Planned work'
                          : 'Service notice'}
                      </strong>{' '}
                      {notice.text}
                    </p>
                  ))}
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
                </>
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
                      <span>
                        {leg.durationMinutes} minutes
                        {displayMode === 'tube' && leg.stopCount !== undefined
                          ? ` · ${leg.stopCount} ${leg.stopCount === 1 ? 'stop' : 'stops'}`
                          : ''}
                      </span>
                    </div>
                    <p>
                      {leg.from} <span aria-hidden="true">→</span> {leg.to}
                    </p>
                    {displayMode !== 'walk' && directionText && (
                      <p className="route-step-direction">
                        <span className="route-step-direction__label">Direction</span>
                        <strong className="route-step-direction__value">
                          {directionText}
                        </strong>
                      </p>
                    )}
                    {displayMode !== 'walk' && !directionText && instructionText && (
                      <p className="route-step-instruction">
                        <span>Instruction</span> {instructionText}
                      </p>
                    )}
                    {displayMode === 'tube' && leg.lineName && leg.stopCount !== undefined && (
                      <TubeStationSequence
                        lineName={leg.lineName}
                        from={leg.from}
                        to={leg.to}
                        stopCount={leg.stopCount}
                        intermediateStops={leg.intermediateStops}
                      />
                    )}
                    {displayMode !== 'walk' ? (
                      <details
                        className={`route-step-details${
                          hasServiceNotices ? ' route-step-details--has-notices' : ''
                        }`}
                      >
                        <summary>
                          <span className="route-disclosure-chevron" aria-hidden="true" />
                          <span>
                            {hasServiceNotices
                              ? 'View service details'
                              : 'View timing details'}
                          </span>
                          <span className="route-step-details__hint">
                            {hasServiceNotices
                              ? `${noticeCount} notice${noticeCount === 1 ? '' : 's'} · expected times`
                              : 'Expected times & published schedule'}
                          </span>
                        </summary>
                        <div className="route-step-details__content">{serviceDetails}</div>
                      </details>
                    ) : (
                      serviceDetails
                    )}
                    {showStationInstructions && (
                      <details className="route-step-instructions">
                        <summary>
                          <span className="route-disclosure-chevron" aria-hidden="true" />
                          <span>Show station instructions</span>
                        </summary>
                        <div className="route-step-instructions__content">
                          {leg.instructions?.summary && (
                            <strong>{leg.instructions.summary}</strong>
                          )}
                          {leg.instructions?.detailed &&
                            leg.instructions.detailed !== leg.instructions.summary && (
                              <p>{leg.instructions.detailed}</p>
                            )}
                          {leg.instructions?.steps && (
                            <WalkingInstructionSteps steps={leg.instructions.steps} />
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
        <p>{needsRecheck ? 'Recheck the journey before setting off; the earlier departure advice is no longer current.' : response.nextAction}</p>
      </div>

      <p className="station-only-note">{response.stationOnlyWarning}</p>

      {response.evidence.length > 0 && (
        <div className="evidence-list">
          <strong>Evidence freshness</strong>
          <ul>
            {response.evidence.map((item) => (
              <li key={`${item.source}-${item.capturedAt}`}>
                <span>{formatEvidenceSource(item.source)}</span>
                <EvidenceAge key={response.checkedAt} ageSeconds={item.ageSeconds} checkedAt={response.checkedAt} now={now} />
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

function WalkingInstructionSteps({ steps }: { steps: string[] }) {
  const normalizedSteps = steps
    .map((step) => normalizeWalkingInstruction(step))
    .filter((step) => step.length > 0)
  const distanceMetres = normalizedSteps.reduce(
    (total, step) => total + (extractWalkingDistance(step) ?? 0),
    0,
  )
  const descriptiveSteps = normalizedSteps.filter(
    (step) => !isDistanceOnlyWalkingInstruction(step),
  )

  return (
    <>
      {distanceMetres > 0 && (
        <p className="route-step-instructions__distance">
          <strong>Walking guidance</strong>
          <span>About {distanceMetres} metres of walking in total.</span>
        </p>
      )}
      {descriptiveSteps.length > 0 && (
        <ul className="route-step-instructions__list">
          {descriptiveSteps.map((step, stepIndex) => (
            <li key={`${stepIndex}-${step}`}>{step}</li>
          ))}
        </ul>
      )}
    </>
  )
}

function normalizeWalkingInstruction(step: string) {
  return step
    .replace(/[\u200B\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isDistanceOnlyWalkingInstruction(step: string) {
  return /^\s*(?:\d+\s+)?for\s+\d+(?:\.\d+)?\s*(?:m|met(?:re|er)s?)\s*$/i.test(step)
}

function extractWalkingDistance(step: string) {
  const match = step.match(/\bfor\s+(\d+(?:\.\d+)?)\s*(?:m|met(?:re|er)s?)\b/i)
  return match === null ? null : Number(match[1])
}
