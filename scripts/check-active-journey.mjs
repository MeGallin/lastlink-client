import assert from 'node:assert/strict'
import {
  emptyLibrary,
  endJourney,
  journeyDraft,
  draftAfterCheck,
  isJourneyLibrary,
  journeyStorageKey,
  loadJourneyLibrary,
  persistJourneyLibrary,
  rememberJourney,
  removeJourney,
  sameJourneyInput,
  setJourneyLeg,
  startJourney,
} from '../src/journeys/journey-store.ts'
import { createRequestGate } from '../src/journeys/request-gate.ts'
import {
  canonicalTubeStationName,
  explainUnverified,
  validateJourneyInput,
} from '../src/journeys/journey-presentation.ts'
import {
  earliestFutureDateTimeValue,
  defaultArriveByInstant,
  futureDeadlinePresets,
  nowLocalDateTimeValue,
  parseLocalDateTimeValue,
  toLocalDateTimeValue,
  toDeadlineIso,
} from '../src/components/journey-time.ts'
const response = {
  contractVersion: 'journey-check.v0.2',
  status: 'viable',
  dataMode: 'fixture',
  checkedAt: '2030-09-11T18:00:00Z',
  summary: 'Fixture',
  nextAction: 'Fixture',
  stationOnly: true,
  stationOnlyWarning: 'Station arrival only.',
  deadline: { arriveBy: '2030-09-11T19:00:00Z' },
  margin: null,
  route: {
    arrivalAt: '2030-09-11T18:45:00Z',
    legs: [
      {
        mode: 'tube',
        from: 'Waterloo',
        to: 'Stratford',
        departureAt: '2030-09-11T18:10:00Z',
        arrivalAt: '2030-09-11T18:45:00Z',
        durationMinutes: 35,
        lineName: 'Jubilee',
      },
    ],
  },
  reasons: [],
  evidence: [],
  warnings: [],
}
const input = {
  originName: 'Waterloo',
  destinationName: 'Stratford',
  arriveBy: '2030-09-11T20:00',
  safetyBufferMinutes: '5',
}
const unrelatedDraft = { ...input, originName: 'Paddington', arriveBy: '2030-09-11T21:00' }
assert.equal(
  draftAfterCheck(unrelatedDraft, input, 'saved'),
  unrelatedDraft,
  'A successful saved A recheck must preserve unsubmitted draft B',
)
assert.notEqual(draftAfterCheck(unrelatedDraft, input, 'draft'), unrelatedDraft)
assert.equal(draftAfterCheck(unrelatedDraft, input, 'draft').originName, 'Waterloo')
assert.equal(draftAfterCheck(unrelatedDraft, input, 'saved').arriveBy, '2030-09-11T21:00')
const snapshot = (id, originName = id) => ({
  id,
  savedAt: '2030-09-11T18:00:00Z',
  input: { ...input, originName },
  response,
})
let library = startJourney(rememberJourney(emptyLibrary(), snapshot('A')), 'A')
for (const id of ['B', 'C', 'D']) library = rememberJourney(library, snapshot(id))
assert.deepEqual(
  library.journeys.map((j) => j.id),
  ['A', 'D', 'C'],
)
library = rememberJourney(library, snapshot('A-recheck', 'A'))
assert.deepEqual(
  library.journeys.map((j) => j.id),
  ['A', 'A-recheck', 'D'],
)
assert.equal(library.active.id, 'A', 'same-input recheck must not replace active snapshot')
const replaced = startJourney(library, 'D')
assert.equal(endJourney(replaced, 'A'), replaced, 'stale End A must not end B/D')
assert.equal(endJourney(replaced, 'D').active, null)
assert.deepEqual(removeJourney(library, 'A'), library)
assert.equal(removeJourney(library, 'D').journeys.length, 2)
assert.equal(setJourneyLeg(library, 99), library)
assert.equal(setJourneyLeg(library, -1), library)
library = setJourneyLeg(library, 0)
const values = new Map()
const storage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
}
assert.equal(persistJourneyLibrary(library, storage), true)
assert.deepEqual(loadJourneyLibrary(storage).library, library)
const originalTimeZone = process.env.TZ
process.env.TZ = 'Europe/Paris'
const travelled = loadJourneyLibrary(storage).library.journeys[0]
assert.equal(new Date(travelled.input.arriveBy).toISOString(), '2030-09-11T19:00:00.000Z')
assert.equal(journeyDraft(travelled.input).arriveBy, '2030-09-11T21:00')
process.env.TZ = 'Europe/London'
assert.equal(journeyDraft(travelled.input).arriveBy, '2030-09-11T20:00')
if (originalTimeZone === undefined) delete process.env.TZ
else process.env.TZ = originalTimeZone
assert.equal(isJourneyLibrary({ ...library, active: { id: 'missing', legIndex: 0 } }), false)
assert.equal(
  isJourneyLibrary({ ...library, journeys: [library.journeys[0], library.journeys[0]] }),
  false,
)
assert.equal(isJourneyLibrary({ ...library, active: { id: 'A', legIndex: 0.5 } }), false)
values.set(journeyStorageKey, '{broken')
assert.ok(loadJourneyLibrary(storage).warning)
assert.equal(values.get(journeyStorageKey), '{broken')
values.delete(journeyStorageKey)
values.set(
  'lastlink.active-journeys.v1',
  JSON.stringify([{ version: 1, savedAt: '2030-09-11T18:00:00Z', input, response }]),
)
const imported = loadJourneyLibrary(storage).library
assert.equal(imported.journeys.length, 1)
assert.equal(imported.active, null)
assert.equal(imported.journeys[0].input.arriveBy, '2030-09-11T19:00:00.000Z')
assert.equal(persistJourneyLibrary(imported, storage), true)
assert.equal(values.has('lastlink.active-journeys.v1'), false)
assert.equal(
  persistJourneyLibrary(library, {
    ...storage,
    setItem: () => {
      throw new Error('quota')
    },
  }),
  false,
)
assert.equal(validateJourneyInput({ ...input, originName: 'Stratford' }, 0).field, 'destination')
assert.equal(
  validateJourneyInput({ ...input, arriveBy: '2000-01-01T00:00' }, Date.now()).field,
  'arriveBy',
)
assert.equal(validateJourneyInput(input, 0), null)
const previousTimeZone = process.env.TZ
process.env.TZ = 'Europe/London'
const referenceNow = new Date('2030-09-11T18:12:34+01:00')
assert.equal(nowLocalDateTimeValue(referenceNow), '2030-09-11T18:12')
assert.equal(earliestFutureDateTimeValue(referenceNow), '2030-09-11T18:13')
assert.deepEqual(
  futureDeadlinePresets(referenceNow).map(({ label }) => label),
  ['In 30 minutes', 'In 1 hour', 'Tomorrow at 09:00'],
)
assert.ok(
  futureDeadlinePresets(referenceNow).every(
    ({ value }) => Date.parse(value) > referenceNow.getTime(),
  ),
)
const daylightSavingRollback = new Date('2026-10-25T00:45:00Z')
const rollbackPresets = futureDeadlinePresets(daylightSavingRollback)
assert.equal(rollbackPresets[0].value, '2026-10-25T01:15')
assert.equal(rollbackPresets[1].value, '2026-10-25T01:45')
assert.equal(rollbackPresets[0].atMs, Date.parse('2026-10-25T01:15:00Z'))
assert.equal(rollbackPresets[1].atMs, Date.parse('2026-10-25T01:45:00Z'))
assert.equal(
  toDeadlineIso(rollbackPresets[0].value, rollbackPresets[0].atMs),
  '2026-10-25T01:15:00.000Z',
)
assert.equal(
  defaultArriveByInstant(daylightSavingRollback).toISOString(),
  '2026-10-25T01:45:00.000Z',
)
const secondRollbackOccurrence = new Date('2026-10-25T01:15:30Z')
assert.equal(earliestFutureDateTimeValue(secondRollbackOccurrence), '2026-10-25T01:16')
assert.equal(
  parseLocalDateTimeValue('2026-10-25T01:16', secondRollbackOccurrence.getTime()),
  Date.parse('2026-10-25T01:16:00Z'),
)
assert.equal(
  parseLocalDateTimeValue('2026-10-25T01:30', daylightSavingRollback.getTime()),
  Date.parse('2026-10-25T01:30:00Z'),
)
assert.equal(
  parseLocalDateTimeValue('2026-10-25T01:30', secondRollbackOccurrence.getTime()),
  Date.parse('2026-10-25T01:30:00Z'),
)
assert.equal(
  toLocalDateTimeValue(new Date('2026-10-25T01:45:00Z')),
  '2026-10-25T01:45',
)
assert.equal(
  sameJourneyInput(
    { ...input, arriveBy: '2026-10-25T01:45:00Z' },
    { ...input, arriveBy: '2026-10-25T01:45' },
    Date.parse('2026-10-25T01:45:00Z'),
  ),
  true,
)
// Saved snapshots compare absolute instants. Two local wall-clock values that
// look the same during the autumn rollback must not collapse into one route.
assert.equal(
  sameJourneyInput(
    { ...input, arriveBy: '2026-10-25T00:30:00Z' },
    { ...input, arriveBy: '2026-10-25T01:30:00Z' },
  ),
  false,
)
assert.equal(
  sameJourneyInput(
    { ...input, arriveBy: '2026-10-25T01:30:00Z' },
    { ...input, arriveBy: '2026-10-25T01:30' },
    Date.parse('2026-10-25T00:30:00Z'),
  ),
  false,
)
if (previousTimeZone === undefined) delete process.env.TZ
else process.env.TZ = previousTimeZone
assert.equal(canonicalTubeStationName('Angel Underground Station'), 'Angel')
assert.equal(canonicalTubeStationName('Edgware Road (Circle Line)'), 'Edgware Road (Circle Line)')
assert.match(
  explainUnverified({ ...response, reasons: [{ code: 'NO_MATCHING_ROUTE' }] }),
  /these stations/,
)
assert.match(
  explainUnverified(
    {
      ...response,
      status: 'not_viable',
      route: null,
      summary: 'This route has already departed and cannot be caught from the origin now.',
      reasons: [{ code: 'DEADLINE_MISSED', message: 'The first route leg has already departed.' }],
    },
  ),
  /already departed.*Review your starting point/,
)
const gate = createRequestGate()
const first = gate.begin()
const second = gate.begin()
assert.equal(first.signal.aborted, true)
assert.equal(first.isCurrent(), false)
assert.equal(second.isCurrent(), true)
gate.cancel()
assert.equal(second.signal.aborted, true)
assert.equal(second.isCurrent(), false)
console.log(
  'Journey lifecycle: protection, bounded history, migration, storage failure, validation and cancellation passed',
)
