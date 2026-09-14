import { useEffect, useState } from 'react'
import { AppLink, Button } from './ui'
import { LastLinkLogo } from './LastLinkLogo'
import { useDialogSurface } from './useDialogSurface'

const howToUseSeenKey = 'lastlink.how-to-use-seen.v1'

export function HowToUseDialog() {
  const { dialogRef, open, close, finish } = useDialogSurface()
  const [isOpen, setIsOpen] = useState(() => shouldShowInitially())

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      open()
    } else if (!isOpen && dialog.open) {
      close()
    }
  }, [isOpen, dialogRef, open, close])

  function closeDialog(restoreFocus = true) {
    rememberSeen()
    close(restoreFocus)
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
        onClick={(event) => { if (event.target === event.currentTarget) closeDialog() }}
        onClose={() => {
          finish()
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
            onClick={() => closeDialog()}
          >
            Close guide ×
          </Button>
          <p className="eyebrow">A quick guide</p>
          <h2 id="how-to-use-title">Plan the last link to your station</h2>
          <p className="how-to-use-dialog__lede">
            Can you reach your station in time? Check a station-arrival route using TfL evidence,
            then review the walking, changes and time to spare.
          </p>

          <ol className="how-to-use-dialog__steps">
            <li>
              <strong>Choose your Tube stations</strong>
              <span>Type to filter the TfL list. Choose your starting station and the station to reach.</span>
            </li>
            <li>
              <strong>Set your deadline</strong>
              <span>
                Choose when you need to be at the destination, then add extra time with Safety margin.
              </span>
            </li>
            <li>
              <strong>Check and read the route</strong>
              <span>Review the answer and route steps. This is an estimate, not live tracking.</span>
            </li>
          </ol>

          <Button variant="primary" type="button" onClick={() => closeDialog()}>
            Got it, plan my journey
          </Button>

          <details className="full-guide">
            <summary>Full guide and limitations</summary>

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
                <strong>Not viable</strong> means the route cannot meet the checked timing requirements.
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
              While travelling, use Resume journey and select your current leg yourself;
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
            <AppLink variant="about" href="#/about" onClick={() => closeDialog(false)}>
              Read more about <LastLinkLogo variant="wordmark" />
            </AppLink>
          </div>
          </details>
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
