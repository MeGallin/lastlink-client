import { useEffect, useRef, useState } from 'react'
import { AppLink, Button } from './ui'
import { LastLinkLogo } from './LastLinkLogo'

const howToUseSeenKey = 'lastlink.how-to-use-seen.v1'

export function HowToUseDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isOpen, setIsOpen] = useState(() => shouldShowInitially())

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  function closeDialog() {
    rememberSeen()
    setIsOpen(false)
  }

  return (
    <>
      <button className="how-to-use-trigger" type="button" onClick={() => setIsOpen(true)}>
        How to use <LastLinkLogo variant="wordmark" />
      </button>

      <dialog
        ref={dialogRef}
        className="how-to-use-dialog"
        aria-labelledby="how-to-use-title"
        onClose={() => {
          rememberSeen()
          setIsOpen(false)
        }}
      >
        <div className="how-to-use-dialog__content">
          <Button
            className="guide-close"
            variant="text"
            type="button"
            autoFocus
            onClick={closeDialog}
          >
            Close guide ×
          </Button>
          <p className="eyebrow">A quick guide</p>
          <h2 id="how-to-use-title">Plan the last link to your station</h2>
          <p className="how-to-use-dialog__lede">
            Use <LastLinkLogo variant="wordmark" /> to answer one practical question: can you
            reach a TfL station before the time you need to be there? It checks the station-arrival
            route and explains the time, walking, changes and safety margin behind the answer.
          </p>

          <ol className="how-to-use-dialog__steps">
            <li>
              <strong>Tell us where you are</strong>
              <span>Choose your starting Tube station from the TfL suggestions.</span>
            </li>
            <li>
              <strong>Choose the station you need</strong>
              <span>Select the Tube station you need from the TfL suggestions. Use Swap stations to reverse the two stations.</span>
            </li>
            <li>
              <strong>Set your deadline</strong>
              <span>
                Choose when you need to be at the destination. Past times are unavailable; use a
                quick choice such as In 30 minutes or In 1 hour, then add extra time with Safety
                margin.
              </span>
            </li>
            <li>
              <strong>Check my route</strong>
              <span>Review the assessment, route legs and the time left after your buffer.</span>
            </li>
          </ol>

          <section className="how-to-use-dialog__section">
            <h3>Read the answer</h3>
            <ul>
              <li>
                <strong>Looks viable</strong> means the route clears your safety margin.
              </li>
              <li>
                <strong>Tight margin</strong> means it may work, but there is little spare time.
              </li>
              <li>
                <strong>Not viable</strong> means the planned arrival misses your deadline.
              </li>
              <li>
                <strong>Unable to verify</strong> means the available evidence was not strong
                enough for a safe answer. Check the details and try again.
              </li>
            </ul>
          </section>

          <section className="how-to-use-dialog__section">
            <h3>Follow each leg</h3>
            <p>
              Choose View route steps to view walking, Tube and other legs in a focused window.
              Close it to return to your result. Tube legs use the line colour and show
              the direction to catch, where to board, the planned stops and where to get off when
              that information is available. Expand View service details for expected and
              published times, and expand station instructions for walking guidance.
            </p>
          </section>

          <section className="how-to-use-dialog__section">
            <h3>Save and recover a plan</h3>
            <p>
              Plans are saved automatically on this browser and device when storage is available.
              Choose Start this journey to protect one plan, with space for two recent checks.
              Retrieve them in Saved journeys → Open saved plan. Opening a plan does not start it.
              While travelling, use Back to my journey and select your current leg yourself;
              LastLink does not track your phone or train.
            </p>
            <p>
              To plan a separate route, choose Start a new journey. This clears the station fields
              without deleting saved plans. If a plan is old or its planned start has passed,
              recheck it with a new deadline instead of treating the old answer as live.
            </p>
          </section>

          <section className="how-to-use-dialog__section">
            <h3>Plan the way back</h3>
            <p>
              From Saved journeys, choose Plan return journey. LastLink reverses the stations into
              a new draft, labels the deadline Arrive back by and leaves the original outbound plan
              unchanged. Set the time you need to arrive back, then check the new route.
            </p>
          </section>

          <section className="how-to-use-dialog__section">
            <h3>Know the limits</h3>
            <p className="how-to-use-dialog__note">
              Up to three plans are kept locally. There is no account sync or automatic refresh.
              This prototype checks arrival at a station using TfL Journey Planner evidence; it
              does not check an onward National Rail service, tickets, Railcards, fares or payment
              eligibility. Keep checking station signs, staff advice and current conditions.
            </p>
          </section>

          <div className="how-to-use-dialog__actions">
            <AppLink variant="about" href="#/about" onClick={closeDialog}>
              Read more about <LastLinkLogo variant="wordmark" />
            </AppLink>
            <Button variant="primary" type="button" onClick={closeDialog}>
              Got it, plan my journey
            </Button>
          </div>
        </div>
      </dialog>
    </>
  )
}

function shouldShowInitially() {
  if (typeof window === 'undefined') return true

  try {
    return window.localStorage.getItem(howToUseSeenKey) !== '1'
  } catch {
    return true
  }
}

function rememberSeen() {
  try {
    window.localStorage.setItem(howToUseSeenKey, '1')
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}
