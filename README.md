# lastlink client

Mobile-first React/TypeScript client for the LastLink TfL-only journey check.

The local API defaults to labelled fixture mode unless it is explicitly
configured for a live provider. The API retains its `dataMode`; the UI labels
fixtures as demo data and other results as saved plans with their check time.
No badge implies continuous live tracking or corroboration of running services.

The client provides one focused journey flow, with separate navigation for
recovery and context:

1. choose a starting Tube station from the 272-station TfL-derived catalogue;
2. choose a destination station from the same catalogue;
3. choose a future arrival deadline and safety margin (the form offers quick future choices and
   prevents past times);
4. submit the request to `POST /api/v1/journey-check`;
5. read the viability, route legs, margin, freshness and next action.

The top navigation keeps the journey screen focused while making two supporting
pages easy to reach:

- **Saved journeys** shows up to three device-local plans. Starting a journey
  protects it, leaving two slots for recent checks. Opening a plan does not start it;
  **Plan return journey** reverses a saved plan into a new editable check with a
  new `Arrive back by` deadline, while leaving the outbound snapshot unchanged;
- **About** explains the answer states, Tube and walking route evidence, saved-route
  behaviour, return planning, active-journey recovery and the limits of a
  station-arrival check.

On small screens the navigation condenses into a hamburger control. Its full-screen
menu keeps Journey, Saved journeys and About one tap away without taking space from
the journey form.

## Client structure

Page-level composition lives in `src/views/`:

- `JourneyView.tsx` composes the journey form, guide and answer;
- `SavedItemsView.tsx` owns saved-route recall and removal;
- `AboutView.tsx` owns the product context page.

Reusable controls and route presentation remain in `src/components/`. `App.tsx`
now owns shared state and hash navigation rather than the markup for each page.

`SiteHeader` and `LastLinkLogo` are separate components. The header owns the
desktop navigation and composes the mobile menu; `LastLinkLogo` owns the
connected-stations mark and wordmark. Its `wordmark` variant is used when the
brand needs to sit inside supporting copy or a compact text treatment.
Navigation labels and destinations live once in `src/components/navigation.ts`
so desktop and mobile cannot drift.

The shared UI boundary is `src/components/ui/`. `Button`, `AppLink`,
`FormField`, `TextInput` and `SelectControl` own repeated control semantics and
visual variants. Domain-specific controls such as the station combobox and
mobile navigation remain feature-local; do not create a generic abstraction
unless the interaction is genuinely reused.

`src/journeys/` separates storage, input/result presentation and request/state
orchestration from the views. See [journey state and recovery](docs/journey-state.md).
The traveller explicitly selects their current leg, can explore another journey,
and returns using **Resume journey**. This compact entry sits in the page flow,
so it cannot cover planning fields, suggestions or saved-card actions. While following
a journey, the current step is the primary view; the original assessment is under
**Plan details**, and **View current step** opens the unchanged route diagram.
An expired deadline is reviewed rather
than automatically moved forward. The UI labels each retained result with its
own route, deadline and check time; failed checks cannot masquerade as that result.

The Journey page opens a **How to use lastlink** guide the first time it is
visited in a browser. It can be reopened from the link above the form. Three quick
steps lead to the planning action, with the full guide in a native disclosure. It
covers the four planning inputs, answer states, route-leg evidence, expected and
published timings, saved-plan recovery, active-journey controls, return planning,
fresh checks and the three-plan device-local limit described on the About page.

Saved cards explain their own freshness. **Resume journey** is the protected
plan's primary action. **Review and recheck** opens an old plan's deadline for
explicit review without changing that time or issuing a request. Return planning
remains a separate secondary action. All modal surfaces share native dialog
semantics, scroll locking and focus return through `useDialogSurface`.

The UI deliberately says when the result is station-only. It does not verify
an onward National Rail service or promise that a traveller will board it.
If the selected station route contains a National Rail leg, the answer shows a
fare-eligibility warning; LastLink does not check tickets, fares, Railcards or
payment eligibility. The API prefers Tube/walking routes, then buses, before
using rail when the non-rail alternatives are not viable.
Station display names are paired with explicit TfL StopPoint IDs before the
request is sent, preventing ambiguous name-only Journey Planner requests. Both
fields must be selected from the Tube-station catalogue; the client never sends
free-form place text to the provider. The catalogue is a refreshable snapshot
from `GET /StopPoint/Mode/tube`, filtered to `NaptanMetroStation` records and
captured in `src/data/stations.ts`.

The current-location button and coordinate/reverse-geocoding flow are not part
of this MVP. They need a separate privacy and location-resolution decision.

## Local development

```sh
npm install
npm run dev
```

The Vite development server proxies `/api` to the owner-managed API at
`http://localhost:3000`. The API must be running separately. Override the API
base path with `VITE_API_BASE_URL` when needed.

Production builds load `.env.production`, which points the browser directly at
the Render API (`https://lastlink-api.onrender.com/api`). This is a public API
base URL, not a credential; secrets remain server-side.

To create and copy a production build to the configured local web root used by
the `lastlink.livenotice.co.uk` site, run:

```sh
npm run build:deploy
```

This runs the normal Vite build first, then stages `dist/` and performs a
rollback-safe directory swap into
`C:\xampp\htdocs\WebSitesDesigns\live\lastlink`. If activation or validation
fails, the previous deployment is restored. Files no longer present in the
build are removed, so the folder contains only the current production output.
The previous version is retained as a rollback snapshot until the next
deployment; if that snapshot cannot be cleaned up, the live deployment is left
untouched.
The helper is intended for Windows/XAMPP deployments.

## Checks

```sh
npm run check
```

This runs the catalogue, response-shape, route-flow, active-journey and rendered-answer
guards, TypeScript validation, Oxlint and the production build. The PWA manifest and
service worker cache only the app shell; `/api` responses are never cached because
journey evidence must remain fresh. After a successful check, the client also keeps
up to three versioned, device-local journey snapshots so a new search or a temporary
failed recheck does not remove the itinerary from recovery. The Journey page intentionally
opens with a blank draft on direct load or refresh; saved plans are recalled explicitly
from Saved journeys, and an active plan remains available through the protected return bar.
These snapshots are recovery references, not a live cache: they are never refreshed in
the background. They can be recalled or removed from the Saved journeys page. The catalogue guard also
checks that the captured Tube catalogue still contains 272 unique stations.

When a viable or tight result is within ten minutes of its planned first leg,
the result shows a local departure countdown. It switches to seconds for the
final minute and disappears once the planned start has passed, at which point
the normal recheck safeguard applies. The countdown is based on the saved TfL
Journey Planner estimate; it is not live vehicle tracking and makes no extra
provider requests.

The hosted API runs on a Render Free instance during the prototype. After idle
time, its first request can take about a minute while the service wakes. The
client keeps a journey check open for up to 75 seconds and changes its status
message after four seconds to say that the check is taking longer than usual
and the service may be waking after inactivity. This is a clear cold-start
explanation, not a keep-alive poll; monitoring should alert on failures, and an
always-on plan is the production upgrade path.
