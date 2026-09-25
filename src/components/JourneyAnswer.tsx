import { Fragment, type CSSProperties, type RefObject } from 'react'
import { ArrowsDownUp } from '@phosphor-icons/react'
import type { JourneyResponse, JourneyStatus } from '../types/journey'
import type { JourneyInput } from '../journeys/journey-store'
import {
  displayDateTime,
  displayTime,
  minutes,
  routeName,
  shortStation,
} from '../journeys/journey-presentation'
import { EvidenceAge } from './EvidenceAge'
import { TubeStationSequence } from './TubeStationSequence'
import { useDisplayClock } from './useDisplayClock'
import { Button } from './ui'
import { RouteDiagramDialog } from './RouteDiagramDialog'
import { DepartureCountdown } from './DepartureCountdown'
import { RouteLegIcon } from './RouteLegIcon'
import { JourneyLegSummary } from './JourneyLegSummary'
import {
  formatAlternativeMargin,
  formatAlternativeServices,
  formatLineName,
  formatRouteDirectionText,
  formatRouteService,
  getRouteChange,
  getLineColor,
  getPrimaryRouteLineColor,
  getRouteDisplayMode,
  providerScheduleMatchesItinerary,
} from './route-flow'

interface JourneyAnswerProps {
  response: JourneyResponse
  answerRef?: RefObject<HTMLElement | null>
  currentInput?: JourneyInput
  isActive?: boolean
  previous?: boolean
  pending?: boolean
  onRecheck?: () => void
  onReview?: () => void
  onStart?: () => void
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
  }).format(new Date(value))
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeZone: 'Europe/London',
  }).format(new Date(value))
}

function formatTimingDate(departureAt: string, arrivalAt: string) {
  const departureDate = formatDate(departureAt)
  const arrivalDate = formatDate(arrivalAt)
  return departureDate === arrivalDate ? departureDate : `${departureDate} to ${arrivalDate}`
}

function formatStatus(status: JourneyStatus) {
  return {
    viable: 'Enough time',
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

export function JourneyAnswer({
  response,
  answerRef,
  currentInput,
  isActive = false,
  previous = false,
  pending = false,
  onRecheck,
  onReview,
  onStart,
}: JourneyAnswerProps) {
  const route = response.route
  const firstLeg = route?.legs[0]
  const firstTrain = route?.legs.find((leg) => leg.mode !== 'walk')
  const durationMinutes = route && firstLeg
    ? Math.max(0, Math.ceil((Date.parse(route.arrivalAt) - Date.parse(firstLeg.departureAt)) / 60_000))
    : undefined
  const now = useDisplayClock(1_000)
  const departure = Date.parse(route?.legs[0]?.departureAt ?? '')
  const needsRecheck =
    (response.status === 'viable' || response.status === 'tight') && now >= departure
  const deadline = Date.parse(currentInput?.arriveBy ?? '')
  const deadlineHasPassed = Number.isFinite(deadline) && now >= deadline
  const canStart =
    !needsRecheck && !deadlineHasPassed && ['viable', 'tight'].includes(response.status)
  const answerStatus = needsRecheck && !isActive ? 'unable_to_verify' : response.status
  const primaryRouteLineColor =
    getPrimaryRouteLineColor(route?.legs)
  const decisionRouteLineColor =
    !needsRecheck && ['viable', 'tight'].includes(answerStatus)
      ? primaryRouteLineColor
      : undefined
  const routeDiagramNeedsFreshCheck = !isActive && (needsRecheck || deadlineHasPassed)
  const routeDiagramStatus = response.status === 'viable' ? 'Viable route' : 'Tight margin'
  const routeDiagramStatusLabel = routeDiagramNeedsFreshCheck
    ? 'Needs a fresh check before travel'
    : `${routeDiagramStatus}${isActive ? ' when checked' : ''}`
  const routeDiagramStatusTone = routeDiagramNeedsFreshCheck ? 'stale' : answerStatus
  const canShowRouteDiagram =
    route !== null &&
    route.legs.length > 0 &&
    ['viable', 'tight'].includes(response.status) &&
    !routeDiagramNeedsFreshCheck
  const journeyNotices = route
    ? route.legs
        .flatMap((leg) => leg.notices ?? [])
        .filter(
          (notice, index, notices) =>
            notices.findIndex(
              (candidate) => candidate.kind === notice.kind && candidate.text === notice.text,
            ) === index,
        )
    : []

  return (
    <section
      ref={answerRef}
      className={`answer answer-${answerStatus}`}
      aria-labelledby="answer-title"
      aria-live="polite"
      tabIndex={-1}
    >
      <div
        className={`answer-decision answer-decision--${answerStatus}`}
        style={
          primaryRouteLineColor
            ? ({
                '--route-accent': primaryRouteLineColor,
                ...(decisionRouteLineColor
                  ? { '--decision-accent': decisionRouteLineColor }
                  : {}),
              } as CSSProperties)
            : undefined
        }
      >
        <div className="answer-heading">
          <div>
            <p className="eyebrow">
              {previous
                ? 'Previous journey, unchanged'
                : isActive
                  ? 'Protected current journey'
                  : 'Assessment at last check'}
            </p>
            <h2 id="answer-title">
              {isActive
                ? 'Your saved route'
                : needsRecheck
                  ? 'Recheck before starting'
                  : formatStatus(response.status)}
            </h2>
          </div>
          <span className={`data-mode data-mode-${response.dataMode}`}>
            {response.dataMode === 'fixture' ? 'Demo data' : 'Saved plan'}
          </span>
        </div>
        {currentInput && (
          <div className="result-identity">
            <strong>{routeName(currentInput)}</strong>
            <span>
              Deadline {displayDateTime(currentInput.arriveBy)} · {currentInput.safetyBufferMinutes}
              -minute margin
            </span>
          </div>
        )}
        {route && (
          <dl className="journey-at-a-glance">
            <div>
              <dt>Expected arrival</dt>
              <dd>{displayTime(route.arrivalAt)}</dd>
            </div>
            {durationMinutes !== undefined && (
              <div><dt>Journey time</dt><dd>{minutes(durationMinutes)}</dd></div>
            )}
            {response.margin && (
              <div>
                <dt>After your buffer</dt>
                <dd>
                  {response.margin.remainingAfterBufferMinutes < 0
                    ? `${minutes(Math.ceil(Math.abs(response.margin.remainingAfterBufferMinutes)))} short`
                    : `${minutes(Math.floor(response.margin.remainingAfterBufferMinutes))} spare`}
                </dd>
              </div>
            )}
          </dl>
        )}
        {!isActive && canStart && firstLeg && (
          <div className="journey-first-steps">
            <JourneyLegSummary leg={firstLeg} label="First" />
            {firstLeg.mode === 'walk' && firstTrain && (
              <JourneyLegSummary leg={firstTrain} label="Then catch" />
            )}
          </div>
        )}
        <p className="route-timing-note">
          Checked {displayDateTime(response.checkedAt)} · London time · saved estimate, not live tracking
        </p>
        {!isActive &&
          !needsRecheck &&
          !deadlineHasPassed &&
          ['viable', 'tight'].includes(response.status) &&
          route?.legs[0] && (
          <DepartureCountdown
            departureAt={route.legs[0].departureAt}
            mode={route.legs[0].mode}
            lineName={route.legs[0].lineName}
          />
        )}
        {previous && (
          <p className="previous-plan-note">This is not the answer to the changed search above.</p>
        )}
        {needsRecheck && !isActive && (
          <p className="answer-summary">
            The planned start time has passed. If you have not started, check a new route. If you
            are already travelling, this itinerary remains available as a reference.
          </p>
        )}
        <p className={needsRecheck ? 'route-timing-note' : 'answer-summary'}>
          {needsRecheck && 'At the last check: '}
          {response.summary}
        </p>
        <p className="prototype-notice">
          {response.dataMode === 'fixture'
            ? 'Demonstration only. Not live travel information.'
            : 'Prototype: Journey Planner estimates. Timetable, arrivals and disruption cross-checks are not connected. Do not rely on this alone for travel.'}
        </p>
        {journeyNotices.length > 0 && (
          <div className="essential-notice answer-service-notices" role="note">
            <strong>Before you travel</strong>
            <ul>
              {journeyNotices.map((notice) => (
                <li key={`${notice.kind}-${notice.text}`}>{notice.text}</li>
              ))}
            </ul>
          </div>
        )}
        {deadlineHasPassed && (
          <p className="previous-plan-note">
            The previous deadline has passed. Keep viewing this plan or review a new time; your
            deadline will not change automatically.
          </p>
        )}
        {(isActive || !canStart || !firstLeg) && <div className="next-action">
          <strong>Next action</strong>
          <p>
            {isActive
              ? 'Follow your saved plan and station signs. Your position is set by you, not tracked.'
              : needsRecheck
                ? 'Review the journey before setting off; the earlier departure advice is no longer current.'
                : route && canStart
                  ? `This plan starts at ${displayTime(route.legs[0].departureAt)}. Check the direction and allow the walking time shown.`
                  : response.nextAction}
          </p>
        </div>}
        {!isActive && (
          <div className="journey-actions">
            {canStart && onStart && (
              <Button type="button" variant="primary" disabled={pending} onClick={onStart}>
                Follow this route
              </Button>
            )}
            {!deadlineHasPassed && onRecheck && (
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={onRecheck}
              >
                Recheck this saved plan
              </Button>
            )}
            {onReview && (
              <Button type="button" variant="text" onClick={onReview}>
                Review stations and deadline
              </Button>
            )}
          </div>
        )}
        {!isActive && canStart && onStart && (
          <p className="route-timing-note">Keep this route on this device and update your progress as you travel.</p>
        )}
      </div>

      {route && route.legs.length > 0 && (
        <div
          className="route-summary"
          style={
            primaryRouteLineColor
              ? ({ '--route-accent': primaryRouteLineColor } as CSSProperties)
              : undefined
          }
        >
          <div className="route-heading">
            <strong>How to get there</strong>
            <div className="route-heading-meta">
              <span>{route.walkingMinutes ?? 0} minutes walking</span>
              <span className="route-total">
                About{' '}
                <strong>
                  {minutes(
                    Math.max(
                      0,
                      Math.ceil(
                        (Date.parse(route.arrivalAt) -
                          Date.parse(route.legs[0]?.departureAt ?? '')) /
                          60_000,
                      ),
                    ),
                  )}
                </strong>
              </span>
            </div>
          </div>
          {route.fareWarning && (
            <p className="route-fare-warning" role="note">
              {route.fareWarning}
            </p>
          )}
          {route.alternativeRoute && (
            <p className="route-selection-note" role="note">
              TfL supplied this as an alternative itinerary. The assessment above explains whether
              it meets your requirements.
            </p>
          )}
          {canShowRouteDiagram && (
            <RouteDiagramDialog
              route={route}
              checkedAt={response.checkedAt}
              status={answerStatus}
              statusLabel={routeDiagramStatusLabel}
              statusTone={routeDiagramStatusTone}
            >
              <RouteDiagram route={route} />
            </RouteDiagramDialog>
          )}
          {route.alternatives && route.alternatives.length > 0 && (
            <details className="route-alternatives">
              <summary>
                <span className="route-disclosure-chevron" aria-hidden="true" />
                Other options ({route.alternatives.length}) · summaries only
              </summary>
              <p>
                Compare these itinerary summaries. The assessment above applies to the detailed
                route below.
              </p>
              <ul>
                {route.alternatives.map((alternative, index) => (
                  <li key={`${alternative.departureAt}-${alternative.arrivalAt}-${index}`}>
                    <div className="route-alternative-heading">
                      <strong>{formatAlternativeServices(alternative.segments)}</strong>
                      <span>{alternative.durationMinutes} minutes total</span>
                    </div>
                    <p>
                      Leave {formatTime(alternative.departureAt)} · arrive{' '}
                      {formatTime(alternative.arrivalAt)} ·{' '}
                      {formatAlternativeMargin(alternative.remainingAfterBufferMinutes)}
                    </p>
                    <p>
                      {formatTimingDate(alternative.departureAt, alternative.arrivalAt)} · TfL
                      Journey Planner estimate
                    </p>
                    <p>
                      {alternative.walkingMinutes === undefined
                        ? 'Walking time not supplied'
                        : `Includes ${alternative.walkingMinutes} ${alternative.walkingMinutes === 1 ? 'minute' : 'minutes'} walking`}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <p className="station-only-note">{response.stationOnlyWarning}</p>

      {response.evidence.length > 0 && (
        <details className="evidence-list answer-evidence">
          <summary>Evidence and freshness</summary>
          <p className="route-timing-note">
            Times are from the TfL Journey Planner itinerary, not live vehicle observations.
            Saved plans are not refreshed automatically.
          </p>
          <ul>
            {response.evidence.map((item) => (
              <li key={`${item.source}-${item.capturedAt}`}>
                <span>{formatEvidenceSource(item.source)}</span>
                <EvidenceAge
                  key={response.checkedAt}
                  ageSeconds={item.ageSeconds}
                  checkedAt={response.checkedAt}
                  now={now}
                />
              </li>
            ))}
          </ul>
        </details>
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

export function RouteDiagram({ route, idPrefix = '' }: { route: NonNullable<JourneyResponse['route']>; idPrefix?: string }) {
  return (
          <ol className="route-flow" aria-label="Journey route">
            {route.legs.map((leg, index) => {
              const previousLeg = route.legs[index - 1]
              const routeChange = previousLeg ? getRouteChange(previousLeg, leg) : undefined
              const lineColor = getLineColor(leg.lineName)
              const displayMode = getRouteDisplayMode(leg.mode, leg.lineName)
              const hasScheduledTiming =
                leg.scheduledDepartureAt !== undefined || leg.scheduledArrivalAt !== undefined
              const hasInstructions = leg.instructions !== undefined
              const directionText = formatRouteDirectionText(
                leg.directions,
                leg.instructions?.detailed,
              )
              const instructionText = leg.instructions?.detailed ?? leg.instructions?.summary
              const showStationInstructions = displayMode === 'walk' && hasInstructions
              const scheduleMatchesItinerary = providerScheduleMatchesItinerary(
                leg.departureAt,
                leg.arrivalAt,
                leg.scheduledDepartureAt,
                leg.scheduledArrivalAt,
              )
              const noticeCount = leg.notices?.length ?? 0
              const accessWalk =
                displayMode === 'walk' &&
                leg.from.trim().toLowerCase() === leg.to.trim().toLowerCase()
              const gap = previousLeg
                ? Math.floor(
                    (Date.parse(leg.departureAt) - Date.parse(previousLeg.arrivalAt)) / 60_000,
                  )
                : 0
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
                        {notice.kind === 'planned_work' ? 'Planned work' : 'Service notice'}
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
                          <time dateTime={leg.departureAt}>{formatTime(leg.departureAt)}</time>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          <strong>Arrive</strong>{' '}
                          <time dateTime={leg.arrivalAt}>{formatTime(leg.arrivalAt)}</time>
                        </span>
                      </span>
                      <small className="route-step-time-note">
                        {formatTimingDate(leg.departureAt, leg.arrivalAt)} · TfL Journey Planner
                        estimate
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
                        {formatTimingDate(leg.scheduledDepartureAt!, leg.scheduledArrivalAt!)} ·
                        provider schedule matches this plan; not a live update
                      </small>
                    )}
                  </div>
                </>
              )
              return (
                <Fragment key={`${leg.departureAt}-${leg.arrivalAt}-${leg.from}`}>
                  {routeChange && (
                    <li
                      id={`${idPrefix}route-change-${index}`}
                      tabIndex={-1}
                      className={`route-flow__change route-flow__change--${routeChange.kind}`}
                      style={{ '--route-line-color': lineColor } as CSSProperties}
                    >
                      <div className="route-flow__change-marker" aria-hidden="true">
                        <ArrowsDownUp size={22} weight="bold" />
                      </div>
                      <div className="route-flow__change-detail">
                        <strong>{routeChange.title}</strong>
                        <p>{routeChange.description}</p>
                        {gap > 0 && (
                          <p>
                            {minutes(gap)} allowed between these legs in the plan (transfer or
                            waiting).
                          </p>
                        )}
                        {routeChange.nextDirection && (
                          <p className="route-change-next">
                            <span>Next train</span> {routeChange.nextDirection}
                          </p>
                        )}
                      </div>
                    </li>
                  )}
                  <li
                    id={`${idPrefix}route-leg-${index}`}
                    tabIndex={-1}
                    className={`route-flow__step route-flow__step--${displayMode}`}
                    style={{ '--route-line-color': lineColor } as CSSProperties}
                  >
                    <div className="route-flow__visual" aria-hidden="true">
                      <span className="route-flow__icon">
                        <RouteLegIcon mode={leg.mode} lineName={leg.lineName} />
                      </span>
                      {index < route.legs.length - 1 && <span className="route-flow__connector" />}
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
                          {minutes(leg.durationMinutes)}
                          {displayMode === 'tube' && leg.stopCount !== undefined
                            ? ` · ${leg.stopCount} ${leg.stopCount === 1 ? 'stop' : 'stops'}`
                            : ''}
                        </span>
                      </div>
                      <p>
                        {accessWalk ? (
                          `${minutes(leg.durationMinutes)} walking/access at ${shortStation(leg.from)}. Supplied by TfL`
                        ) : (
                          <>
                            {shortStation(leg.from)} <span aria-hidden="true">→</span>{' '}
                            {shortStation(leg.to)}
                          </>
                        )}
                      </p>
                      {!routeChange && gap > 0 && (
                        <p className="route-timing-note">
                          {minutes(gap)} allowed between these legs (transfer or waiting).
                        </p>
                      )}
                      {displayMode !== 'walk' && directionText && (
                        <p className="route-step-direction">
                          <span className="route-step-direction__label">Direction</span>
                          <strong className="route-step-direction__value">{directionText}</strong>
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
                        <>
                          {hasServiceNotices && (
                            <p className="essential-notice" role="note">
                              <strong>Before you travel: </strong>
                              {leg.notices!.map((notice) => notice.text).join(' ')}
                            </p>
                          )}
                          <details
                            className={`route-step-details${
                              hasServiceNotices ? ' route-step-details--has-notices' : ''
                            }`}
                          >
                            <summary>
                              <span className="route-disclosure-chevron" aria-hidden="true" />
                              <span>
                                {hasServiceNotices ? 'View service details' : 'View timing details'}
                              </span>
                              <span className="route-step-details__hint">
                                {hasServiceNotices
                                  ? `${noticeCount} notice${noticeCount === 1 ? '' : 's'} · expected times`
                                  : 'Expected times & published schedule'}
                              </span>
                            </summary>
                            <div className="route-step-details__content">{serviceDetails}</div>
                          </details>
                        </>
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
  const descriptiveSteps = normalizedSteps.filter((step) => !isDistanceOnlyWalkingInstruction(step))

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
