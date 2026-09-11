# lastlink client

Mobile-first React/TypeScript client for the LastLink TfL-only journey check.

The local API defaults to labelled fixture mode unless it is explicitly
configured for a live provider. Every answer exposes its `dataMode` (`fixture`,
`cache` or `live`); fixture evidence is for development and must not be read as
current passenger information.

The client provides one focused flow:

1. enter a London Tube station, address or landmark as the starting point;
2. search for a destination station from the 272-station TfL-derived catalogue;
3. choose an arrival deadline and safety margin;
4. submit the request to `POST /api/v1/journey-check`;
5. read the viability, route legs, margin, freshness and next action.

The UI deliberately says when the result is station-only. It does not verify
an onward National Rail service or promise that a traveller will board it.
If the selected station route contains a National Rail leg, the answer shows a
fare-eligibility warning; LastLink does not check tickets, fares, Railcards or
payment eligibility. The API prefers Tube/walking routes, then buses, before
using rail when the non-rail alternatives are not viable.
Station display names are paired with explicit TfL StopPoint IDs before the
request is sent, preventing ambiguous name-only Journey Planner requests. A
free-form origin is sent as a name only so the provider can resolve it; the
client does not invent a station ID. The catalogue is a refreshable snapshot
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

## Checks

```sh
npm run check
```

This runs the catalogue, response-shape, route-flow and rendered-answer guards, TypeScript
validation, Oxlint and the production build. The PWA manifest and service worker cache
only the app shell; `/api` responses are never cached because journey evidence
must remain fresh. The catalogue guard also checks that the captured Tube
catalogue still contains 272 unique stations.
