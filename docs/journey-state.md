# Journey state and recovery

The UI keeps three distinct concepts: the editable search draft, the displayed
result (with its own endpoints/deadline/check time), and an explicitly started
journey. Editing or failing a search never changes the started itinerary.

## Device-local library

`src/journeys/journey-store.ts` owns the versioned local-storage record and pure
history/progress operations. Up to three snapshots are retained: one protected
started journey plus up to two recent checks, or three recent checks when none
is started. A same-input recheck cannot overwrite the protected snapshot.
Snapshot IDs are separate from timestamps. Previous v1 snapshots are migrated
without assuming any was started. A complete v2 write precedes old-key removal.
Corrupt records are not destructively cleared on read. Save failures are visible;
the in-memory result remains usable but reload persistence is not promised.

Opening a saved plan does not start it. Starting a replacement requires explicit
confirmation. Ending removes protection but retains the snapshot as a recent
check. A protected plan cannot be deleted until ended. Deleting the displayed
recent plan also clears that answer, as the confirmation explains.

`useJourneyWorkspace` owns orchestration; page components own layout. A direct
load or refresh of the Journey page deliberately starts with a blank draft and
does not reopen the most recent snapshot. Saved plans remain in the library;
an active protected plan stays available through the in-flow `Resume journey` entry,
and any plan can be opened explicitly from Saved journeys. The header logo and
Plan a journey links use the same fresh-draft action. Progress is never inferred
from time, GPS or a train position. No accounts or cross-device sync are added.
Storage events reconcile library changes from other tabs without replacing an
open itinerary with new transport evidence.

## Checks and time

One request gate invalidates older work on edits, navigation or saved recall;
abort is an optimisation, and a revision check also rejects late responses.
Recheck targets the displayed snapshot, not a different draft. Failed checks
and successful saved-plan rechecks both preserve an unrelated editable draft.
Only submitting the draft updates that draft from the successful response. Failed checks
identify their own input and preserve the old result. An expired deadline must
be edited explicitly; it is never advanced automatically. Inputs use the device
timezone with explicit help; rendered route times are labelled London time.
Saved deadlines retain an absolute, offset-bearing instant; legacy wall-time
records are normalised from their original response deadline. Only editable
controls convert to device-local time, so a timezone change cannot reinterpret
a saved check. Recheck feedback renders even when the form is closed.
Confirmations are invalidated by cross-tab storage changes, and start/end
operations validate the expected protected journey ID before changing it.

TfL remains the source of route facts. Reference plans never claim live tracking.
The prototype limitation remains visible: Journey Planner is connected, but
timetable, arrivals and disruption corroboration are not. Supplied notices are
visible before the optional timing details. No location, platform, turn or
severity is invented. Alternative summaries remain non-selectable; maps and
mode preferences remain separate future work.
The manually selected step repeats applicable interchange/reboarding warnings
and supplied notices before its direction. Jumping into the full route includes
the preceding interchange context, including a same-line branch change.

## Verification

`npm run check` includes storage/migration/protection, request invalidation,
input validation, rendered result, navigation, response and route-flow guards,
typecheck, lint and production build. Browser QA must exercise start, progress,
reload, explore/fail/return, replacement and deletion cancellation. Saved API
Postman collections and independent review remain mandatory before commit.
Real phone lock/offline, screen-reader and on-train verification remain pilot
gates; a development-server reload does not prove production offline support.
