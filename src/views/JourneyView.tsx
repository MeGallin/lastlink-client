import type { RefObject } from 'react'
import { HowToUseDialog } from '../components/HowToUseDialog'
import { JourneyAnswer, RouteDiagram } from '../components/JourneyAnswer'
import { JourneyForm } from '../components/JourneyForm'
import { CurrentJourney } from '../components/CurrentJourney'
import { JourneyCheckFeedback } from '../components/JourneyCheckFeedback'
import type { useJourneyWorkspace } from '../journeys/useJourneyWorkspace'
import { displayDateTime, routeName, shortStation } from '../journeys/journey-presentation'
import { Button } from '../components/ui'

export function JourneyView({
  workspace: w,
  answerRef,
  onStart,
  onEnd,
  onExplore,
  onStartNew,
}: {
  workspace: ReturnType<typeof useJourneyWorkspace>
  answerRef: RefObject<HTMLElement | null>
  onStart: () => void
  onEnd: () => void
  onExplore: (origin?: string) => void
  onStartNew: () => void
}) {
  const isActive = !!w.shown && w.shown.id === w.active?.id
  const layoutClass = w.editing ? 'journey-layout--form-only' : 'journey-layout--result-only'

  return (
    <div className="journey-view">
      <section className="intro" aria-labelledby="page-title">
        <div className="intro-heading">
          <h1 id="page-title" tabIndex={-1}>
            {w.editing ? 'Plan a journey' : isActive ? 'Current journey' : 'Your journey'}
          </h1>
          <HowToUseDialog />
        </div>
      </section>
      <div className={`journey-layout ${layoutClass}`}>
        {w.editing ? (
          <div className="journey-layout__planner">
            <JourneyForm
              values={w.draft}
              deadlineAtMs={w.draftDeadlineAtMs}
              onChange={w.editDraft}
              onCheck={w.check}
              pending={w.pending}
              error={w.error}
              previousName={w.shown ? routeName(w.shown.input) : undefined}
              returnFrom={w.returnJourneyFrom ? routeName(w.returnJourneyFrom.input) : undefined}
            />
            {w.shown && (
              <p className="draft-change-note" role="status">
                Your previous result is hidden while you edit this search. It remains available in
                Saved journeys.
              </p>
            )}
          </div>
        ) : (
          <div className="journey-layout__result">
            {w.shown && (
              <section className="journey-search-summary" aria-label="Journey summary">
                <div className="journey-search-summary__route">
                  <strong>
                    {shortStation(w.shown.input.originName)}
                    <span aria-hidden="true"> → </span>
                    {shortStation(w.shown.input.destinationName)}
                  </strong>
                  <span>{w.shown.input.timeMode === 'leave_now' ? 'Leave now · next practical route' : `Arrive by ${displayDateTime(w.shown.input.arriveBy)} London time`}</span>
                </div>
                <div className="journey-search-summary__actions">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onExplore(w.shown!.input.originName)}
                  >
                    Edit search
                  </Button>
                  <Button type="button" variant="secondary" onClick={onStartNew}>
                    New journey
                  </Button>
                </div>
              </section>
            )}
            <JourneyCheckFeedback
              error={w.error}
              pending={w.pending}
              previousName={w.shown ? routeName(w.shown.input) : undefined}
            />
            {isActive && w.library.active && !w.editing && (
              <div className="journey-follow-layout">
                <CurrentJourney
                  journey={w.shown!}
                  legIndex={w.library.active.legIndex}
                  onLeg={w.changeLeg}
                  onReplan={onExplore}
                  onEnd={onEnd}
                  onViewStep={(target) => {
                    const step = document.getElementById(`current-${target}`)
                    step?.scrollIntoView({ block: 'start' })
                    step?.focus({ preventScroll: true })
                  }}
                />
                {w.shown?.response.route && (
                  <section className="current-route" aria-labelledby="current-route-title">
                    <h2 id="current-route-title">Your full route</h2>
                    <p className="route-timing-note">
                      Saved instructions · follow station signs and current advice.
                    </p>
                    <RouteDiagram route={w.shown.response.route} idPrefix="current-" />
                  </section>
                )}
              </div>
            )}
            {w.shown && (
              <details
                key={w.shown.id + ':' + String(isActive && !w.editing)}
                className={
                  isActive && !w.editing
                    ? 'protected-plan-details'
                    : 'plan-details plan-details--expanded'
                }
                open={isActive && !w.editing ? undefined : true}
              >
                <summary>
                  Plan details <span>Original route, deadline and evidence</span>
                </summary>
                <JourneyAnswer
                  key={w.shown.id}
                  response={w.shown.response}
                  currentInput={w.shown.input}
                  answerRef={answerRef}
                  isActive={isActive}
                  previous={!!w.error}
                  pending={!!w.pending}
                  onRecheck={() => w.check(w.shown!.input, 'saved')}
                  onReview={() => onExplore(w.shown!.input.originName)}
                  onStart={onStart}
                />
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
