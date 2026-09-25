import { useState, type RefObject } from 'react'
import { HowToUseDialog } from '../components/HowToUseDialog'
import { JourneyAnswer, RouteDiagram } from '../components/JourneyAnswer'
import { JourneyForm } from '../components/JourneyForm'
import { CurrentJourney } from '../components/CurrentJourney'
import { JourneyCheckFeedback } from '../components/JourneyCheckFeedback'
import type { useJourneyWorkspace } from '../journeys/useJourneyWorkspace'
import { displayDateTime, routeName, shortStation } from '../journeys/journey-presentation'
import { sameJourneyInput } from '../journeys/journey-store'
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
  const [plannerVisibility, setPlannerVisibility] = useState({
    focusVersion: w.focusVersion,
    collapsed: false,
  })
  const draftChanged =
    !!w.shown && !sameJourneyInput(w.shown.input, w.draft, w.draftDeadlineAtMs)
  const hidePreviousAnswer = w.editing && draftChanged
  const canCollapsePlanner =
    w.editing && !!w.shown && !draftChanged && !w.pending && !w.error
  const plannerCollapsed =
    plannerVisibility.focusVersion === w.focusVersion
      ? plannerVisibility.collapsed
      : w.focusIntent === 'result' && !!w.shown && !w.pending

  const layoutClass = w.editing
    ? w.shown && !hidePreviousAnswer
      ? 'journey-layout--split'
      : 'journey-layout--form-only'
    : 'journey-layout--result-only'

  return (
    <div className="journey-view">
      <section className="intro" aria-labelledby="page-title">
        <div className="intro-heading">
          <h1 id="page-title" tabIndex={-1}>
            {isActive && !w.editing ? 'Current journey' : 'Plan a journey'}
          </h1>
          <HowToUseDialog />
        </div>
      </section>
      <div className={`journey-layout ${layoutClass}`}>
        <div
          className={`journey-layout__planner${plannerCollapsed && canCollapsePlanner ? ' journey-layout__planner--collapsed' : ''}`}
        >
          {w.editing && canCollapsePlanner && plannerCollapsed && w.shown && (
            <section className="journey-search-summary" aria-label="Current search">
              <div className="journey-search-summary__route">
                <span className="eyebrow">Current search</span>
                <strong>
                  {shortStation(w.shown.input.originName)}
                  <span aria-hidden="true"> → </span>
                  {shortStation(w.shown.input.destinationName)}
                </strong>
                <span>Arrive by {displayDateTime(w.shown.input.arriveBy)} London time</span>
              </div>
              <Button
                type="button"
                variant="secondary"
                aria-label={`Edit ${routeName(w.shown.input)} search`}
                onClick={() => {
                  setPlannerVisibility({ focusVersion: w.focusVersion, collapsed: false })
                  onExplore(w.shown!.input.originName)
                }}
              >
                Edit search
              </Button>
            </section>
          )}
          {w.editing ? (
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
          ) : null}
          {!w.editing && (
            <JourneyCheckFeedback
              error={w.error}
              pending={w.pending}
              previousName={w.shown ? routeName(w.shown.input) : undefined}
            />
          )}
          {hidePreviousAnswer && (
            <p className="draft-change-note" role="status">
              Your previous result is hidden while you edit this search. It remains available in Saved
              journeys.
            </p>
          )}
        </div>

        <div className="journey-layout__result">
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
                  <p className="route-timing-note">Saved instructions · follow station signs and current advice.</p>
                  <RouteDiagram route={w.shown.response.route} idPrefix="current-" />
                </section>
              )}
            </div>
          )}
          {w.shown && !hidePreviousAnswer && (
            <details
              key={w.shown.id + ':' + String(isActive && !w.editing)}
              className={isActive && !w.editing ? 'protected-plan-details' : 'plan-details plan-details--expanded'}
              open={isActive && !w.editing ? undefined : true}
            >
              <summary>Plan details <span>Original route, deadline and evidence</span></summary>
              <JourneyAnswer
                key={w.shown.id}
                response={w.shown.response}
                currentInput={w.shown.input}
                answerRef={answerRef}
                isActive={isActive}
                previous={w.editing && (!!w.error || draftChanged)}
                pending={!!w.pending}
                onRecheck={() => w.check(w.shown!.input, 'saved')}
                onReview={() => onExplore(w.shown!.input.originName)}
                onStart={onStart}
              />
            </details>
          )}
          {!w.editing && (
            <section className="new-journey-prompt" aria-label="Start a new journey">
              <div className="new-journey-prompt__copy">
                <p className="eyebrow">Plan something else</p>
                <p>Start with empty station fields. Saved plans and your protected journey stay unchanged.</p>
              </div>
              <Button type="button" variant="secondary" onClick={onStartNew}>
                Start a new journey
              </Button>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
