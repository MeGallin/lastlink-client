import { useState, type RefObject } from 'react'
import { HowToUseDialog } from '../components/HowToUseDialog'
import { JourneyAnswer } from '../components/JourneyAnswer'
import { JourneyForm } from '../components/JourneyForm'
import { CurrentJourney } from '../components/CurrentJourney'
import { JourneyCheckFeedback } from '../components/JourneyCheckFeedback'
import type { useJourneyWorkspace } from '../journeys/useJourneyWorkspace'
import { routeName } from '../journeys/journey-presentation'
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
  const [diagramRequest, setDiagramRequest] = useState<{ journeyId: string; target: string }>()
  const draftChanged =
    !!w.shown && !sameJourneyInput(w.shown.input, w.draft, w.draftDeadlineAtMs)
  const hidePreviousAnswer = w.editing && draftChanged
  return (
    <>
      <section className="intro" aria-labelledby="page-title">
        <div className="intro-heading">
          <h1 id="page-title" tabIndex={-1}>
            Reach your station in time
          </h1>
          <HowToUseDialog />
        </div>
        <p className="intro-copy">Your route, directions and time to spare.</p>
      </section>
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
      ) : (
        <section className="new-journey-prompt" aria-label="Start a new journey">
          <div className="new-journey-prompt__copy">
            <p className="eyebrow">Plan something else</p>
            <p>
              Clear the current search and start with empty station fields. Your saved journey
              stays protected in Saved journeys.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={onStartNew}>
            Start a new journey
          </Button>
        </section>
      )}
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
      {isActive && w.library.active && !w.editing && (
        <CurrentJourney
          journey={w.shown!}
          legIndex={w.library.active.legIndex}
          onLeg={w.changeLeg}
          onReplan={onExplore}
          onEnd={onEnd}
          onViewStep={(target) => setDiagramRequest({ journeyId: w.shown!.id, target })}
        />
      )}
      {w.shown && !hidePreviousAnswer && (
        <JourneyAnswer
          key={w.shown.id}
          onRouteDialogClose={() => setDiagramRequest(undefined)}
          routeDialogRequest={diagramRequest?.journeyId === w.shown.id ? diagramRequest : undefined}
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
      )}
    </>
  )
}
