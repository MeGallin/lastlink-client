import { LastLinkLogo } from '../components/LastLinkLogo'
import { Button } from '../components/ui'

export function AboutView() {
  return (
    <article className="page-card about-page" aria-labelledby="about-title">
      <div className="page-heading">
        <p className="eyebrow">
          About <LastLinkLogo variant="wordmark" />
        </p>
        <h1 id="about-title" tabIndex={-1}>
          A clear plan for the last link
        </h1>
        <p className="page-lede">
          <LastLinkLogo variant="wordmark" /> turns a station-arrival deadline into a route you
          can understand and act on, whether you are planning ahead or already on your way.
        </p>
      </div>

      <nav className="about-index" aria-label="On this page">
        <span>On this page</span>
        {[
          ['about-planning', 'Planning'],
          ['about-route', 'Route and times'],
          ['about-saved', 'Saved journeys'],
          ['about-limits', 'Evidence and limits'],
        ].map(([id, label]) => (
          <Button key={id} type="button" variant="text" onClick={() => {
            const heading = document.getElementById(id)
            heading?.scrollIntoView({ block: 'start', behavior: 'auto' })
            heading?.focus({ preventScroll: true })
          }}>{label}</Button>
        ))}
      </nav>

      <div className="about-sections">
        <section>
          <h2>
            What <LastLinkLogo variant="wordmark" /> does
          </h2>
          <p>
            Enter where you are, choose the TfL station you need to reach, and set an arrival
            deadline. <LastLinkLogo variant="wordmark" /> checks the available TfL journey and
            explains whether it leaves enough time for walking, changes and your chosen safety
            margin. The answer is about reaching that station, not completing an onward journey.
          </p>
        </section>

        <section>
          <h2 id="about-planning" tabIndex={-1}>Plan a journey in four steps</h2>
          <ol>
            <li>
              <strong>Starting point:</strong> choose a Tube station from the TfL suggestions.
            </li>
            <li>
              <strong>Station to reach:</strong> select a Tube station from the suggestions so the
              request uses its TfL identity. Swap stations reverses the two Tube stations.
            </li>
            <li>
              <strong>Arrival deadline:</strong> set the time you need to be at the station. Past
              times cannot be selected, and quick choices offer common future deadlines. The form
              shows the device time zone and route times are London time.
            </li>
            <li>
              <strong>Safety margin:</strong> add extra time for walking, finding the right place
              and ordinary uncertainty, then choose Check my route.
            </li>
          </ol>
          <p>
            The home page opens with a fresh draft. Use Start a new journey whenever you want to
            clear the current form and begin again; this does not delete saved plans.
          </p>
        </section>

        <section>
          <h2>How to read an answer</h2>
          <ul>
            <li>
              <strong>Looks viable</strong> means the planned route clears your buffer.
            </li>
            <li>
              <strong>Tight margin</strong> means the route is possible but leaves little room.
            </li>
            <li>
              <strong>Not viable</strong> means the route cannot meet the checked timing requirements.
            </li>
            <li>
              <strong>Unable to verify</strong> means the available evidence was not strong enough
              to give a safe answer.
            </li>
          </ul>
          <p>
            A result is labelled with its route, deadline, check time and data mode. It is a record
            of the last check, not a promise that conditions are unchanged now.
          </p>
        </section>

        <section>
          <h2 id="about-route" tabIndex={-1}>Follow the route leg by leg</h2>
          <p>
            Choose View route steps for a focused view of the route, filling the screen on a
            phone. Close returns to the result; View current step opens the diagram at your
            selected leg while travelling. Legs appear in travel order. Walking legs use a dotted connector and walking-person
            icon. Tube legs use the actual line colour, a Tube icon, the line direction and the
            stations between boarding and alighting when TfL provides that sequence.
          </p>
          <ul>
            <li>
              <strong>Board here</strong> marks the station where that Tube leg starts.
            </li>
            <li>
              <strong>Get off here</strong> marks the station where that leg ends, including its
              stop number when available.
            </li>
            <li>
              <strong>Change lines</strong> explains where to leave one service and which direction
              to follow next.
            </li>
            <li>
              <strong>View service details</strong> opens expected journey times, published schedule
              times and relevant notices. Station instructions open separately when available.
            </li>
          </ul>
        </section>

        <section>
          <h2>Understand the times</h2>
          <p>
            Expected journey times are estimates from the TfL Journey Planner itinerary. Published
            schedule times are provider schedule information, not live vehicle observations. The
            route total, walking time and margin are calculated from the returned itinerary and
            your deadline. Check the route again when your departure time is close or conditions
            have changed.
          </p>
        </section>

        <section>
          <h2 id="about-saved" tabIndex={-1}>Save, retrieve and reverse a journey</h2>
          <p>
            Up to three plans are kept in this browser on this device when storage is available.
            Choose Start this journey to protect one plan; two slots remain for recent checks. New
            searches cannot replace the protected plan. Without a started journey, the three most
            recent checks are kept.
          </p>
          <p>
            Open Saved journeys to retrieve a plan; opening it does not start it. Choose Plan return
            journey to reverse the saved stations into a new editable draft, set a new Arrive back
            by deadline and check the way home without changing the original outbound plan. A
            successful return is saved as its own plan. End a protected journey before removing
            it; ending keeps it as a recent check until the history limit replaces or you remove
            it. Clearing browser data removes saved plans. Nothing is synced to an account or
            refreshed automatically.
          </p>
        </section>

        <section>
          <h2>While travelling</h2>
          <p>
            Start a journey only when you want to protect that plan. In the progress panel, choose
            your current leg yourself, use View current step to return to its route detail, or use
            Replan from here to create a separate search from the current station. If you visit
            another page or search, Resume journey returns to the protected plan. The original
            assessment remains under Plan details while you follow the current step.
          </p>
          <p>
            Progress survives reload when saved successfully, but <LastLinkLogo variant="wordmark" />
            does not track your phone or train. If the planned start or deadline has passed, the
            old result remains available as a reference and you must choose a new time explicitly.
          </p>
        </section>

        <section>
          <h2 id="about-limits" tabIndex={-1}>Freshness and provider evidence</h2>
          <p>
            TfL provider responses are the source of truth for the journey check. The prototype
            currently connects Journey Planner for the route estimate and shows the returned
            timetable, walking instructions and notices where supplied. Saved results are marked
            for a fresh check when their planned time has passed. A temporary provider failure does
            not delete the previous saved plan.
          </p>
        </section>

        <section>
          <h2>
            What <LastLinkLogo variant="wordmark" /> does not promise
          </h2>
          <ul>
            <li>It checks arrival at a station, not the onward National Rail service.</li>
            <li>It does not check tickets, Railcards, fares or payment eligibility.</li>
            <li>It does not provide live vehicle tracking or automatic background refresh.</li>
            <li>It does not replace checking signs, staff advice or current station conditions.</li>
            <li>It does not yet provide an in-app geographical walking map.</li>
            <li>It does not sync plans between browsers or devices.</li>
          </ul>
        </section>

        <section>
          <h2>Use it safely</h2>
          <p>
            Check again before setting off, especially when a result is marked Needs fresh check or
            your planned departure time has passed. Keep the station signs and current service
            announcements in view. If you are already travelling, a saved route can help you
            remember the plan, but it should not be treated as a live service update.
          </p>
        </section>
      </div>
    </article>
  )
}
