import assert from 'node:assert/strict'
import { isJourneyResponse } from '../src/api/journey-response.ts'

const validResponse = {
  contractVersion: 'journey-check.v0.2',
  status: 'viable',
  dataMode: 'live',
  checkedAt: '2026-09-08T18:00:00.000Z',
  summary: 'A route is available.',
  nextAction: 'Leave now.',
  stationOnly: true,
  stationOnlyWarning: 'Station only.',
  deadline: { arriveBy: '2026-09-08T19:00:00+01:00' },
  margin: {
    arrivalAt: '2026-09-08T18:45:00+01:00',
    transferMinutes: 0,
    safetyBufferMinutes: 5,
    availableMinutes: 15,
    remainingAfterBufferMinutes: 10,
  },
  route: {
    arrivalAt: '2026-09-08T18:45:00+01:00',
    walkingMinutes: 5,
    legs: [
      {
        mode: 'tube',
        lineName: 'Jubilee',
        from: 'Stratford Underground Station',
        to: 'Waterloo Underground Station',
        departureAt: '2026-09-08T18:25:00+01:00',
        arrivalAt: '2026-09-08T18:40:00+01:00',
        durationMinutes: 15,
      },
    ],
  },
  reasons: [{ code: 'ROUTE_FOUND', message: 'Evidence found.' }],
  evidence: [
    {
      source: 'tfl_journey_planner',
      capturedAt: '2026-09-08T18:00:00.000Z',
      ageSeconds: 0,
    },
  ],
  warnings: [],
}

assert.equal(isJourneyResponse(validResponse), true)

const missedDeadline = structuredClone(validResponse)
missedDeadline.status = 'not_viable'
missedDeadline.margin.availableMinutes = -4
missedDeadline.margin.remainingAfterBufferMinutes = -9
assert.equal(isJourneyResponse(missedDeadline), true)

const malformedRoute = structuredClone(validResponse)
malformedRoute.route.legs[0].arrivalAt = null
assert.equal(isJourneyResponse(malformedRoute), false)

const malformedEvidence = structuredClone(validResponse)
malformedEvidence.evidence[0].ageSeconds = Number.NaN
assert.equal(isJourneyResponse(malformedEvidence), false)

const malformedContract = structuredClone(validResponse)
malformedContract.contractVersion = 'legacy'
assert.equal(isJourneyResponse(malformedContract), false)

const offsetFreeTimestamp = structuredClone(validResponse)
offsetFreeTimestamp.checkedAt = '2026-09-08T18:00:00'
assert.equal(isJourneyResponse(offsetFreeTimestamp), false)

const impossibleCalendarDate = structuredClone(validResponse)
impossibleCalendarDate.checkedAt = '2026-02-30T18:00:00+00:00'
assert.equal(isJourneyResponse(impossibleCalendarDate), false)

console.log('Response-shape guard passed: valid and malformed payloads covered')
