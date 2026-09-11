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
        directions: ['Towards Stanmore'],
        from: 'Stratford Underground Station',
        fromTflStopPointId: '940GZZLUSTD',
        to: 'Waterloo Underground Station',
        toTflStopPointId: '940GZZLUWLO',
        departureAt: '2026-09-08T18:25:00+01:00',
        arrivalAt: '2026-09-08T18:40:00+01:00',
        scheduledDepartureAt: '2026-09-08T18:24:00+01:00',
        scheduledArrivalAt: '2026-09-08T18:39:00+01:00',
        instructions: {
          summary: 'Take the Jubilee line',
          detailed: 'Follow signs for the Jubilee line towards Stanmore.',
          steps: ['Use the westbound platform.'],
        },
        notices: [
          { kind: 'disruption', text: 'Minor delays are reported on this leg.' },
          { kind: 'planned_work', text: 'Planned platform works may affect the interchange.' },
        ],
        durationMinutes: 15,
      },
    ],
    alternativeRoute: true,
    alternatives: [
      {
        departureAt: '2026-09-08T18:20:00+01:00',
        arrivalAt: '2026-09-08T18:50:00+01:00',
        durationMinutes: 30,
        walkingMinutes: 8,
        remainingAfterBufferMinutes: 5,
        segments: [
          { mode: 'bus', lineName: 'Example bus' },
          { mode: 'walk' },
        ],
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

const malformedDirections = structuredClone(validResponse)
malformedDirections.route.legs[0].directions = ['']
assert.equal(isJourneyResponse(malformedDirections), false)

const malformedStopPointId = structuredClone(validResponse)
malformedStopPointId.route.legs[0].toTflStopPointId = '  '
assert.equal(isJourneyResponse(malformedStopPointId), false)

const malformedSchedule = structuredClone(validResponse)
malformedSchedule.route.legs[0].scheduledArrivalAt = 'not-a-date'
assert.equal(isJourneyResponse(malformedSchedule), false)

const reversedSchedule = structuredClone(validResponse)
reversedSchedule.route.legs[0].scheduledDepartureAt = '2026-09-08T18:40:00+01:00'
reversedSchedule.route.legs[0].scheduledArrivalAt = '2026-09-08T18:39:00+01:00'
assert.equal(isJourneyResponse(reversedSchedule), false)

const malformedInstructions = structuredClone(validResponse)
malformedInstructions.route.legs[0].instructions = { steps: [] }
assert.equal(isJourneyResponse(malformedInstructions), false)

const malformedFareWarning = structuredClone(validResponse)
malformedFareWarning.route.fareWarning = ' '
assert.equal(isJourneyResponse(malformedFareWarning), false)

const malformedNoticeKind = structuredClone(validResponse)
malformedNoticeKind.route.legs[0].notices[0].kind = 'information'
assert.equal(isJourneyResponse(malformedNoticeKind), false)

const malformedNoticeText = structuredClone(validResponse)
malformedNoticeText.route.legs[0].notices[0].text = ' '.repeat(3)
assert.equal(isJourneyResponse(malformedNoticeText), false)

const oversizedNotice = structuredClone(validResponse)
oversizedNotice.route.legs[0].notices[0].text = 'x'.repeat(241)
assert.equal(isJourneyResponse(oversizedNotice), false)

const emptyNotices = structuredClone(validResponse)
emptyNotices.route.legs[0].notices = []
assert.equal(isJourneyResponse(emptyNotices), false)

const malformedAlternative = structuredClone(validResponse)
malformedAlternative.route.alternatives[0].arrivalAt = 'not-a-date'
assert.equal(isJourneyResponse(malformedAlternative), false)

const emptyAlternatives = structuredClone(validResponse)
emptyAlternatives.route.alternatives = []
assert.equal(isJourneyResponse(emptyAlternatives), false)

const malformedAlternativeSegments = structuredClone(validResponse)
malformedAlternativeSegments.route.alternatives[0].segments = []
assert.equal(isJourneyResponse(malformedAlternativeSegments), false)

const malformedAlternativeFlag = structuredClone(validResponse)
malformedAlternativeFlag.route.alternativeRoute = 'true'
assert.equal(isJourneyResponse(malformedAlternativeFlag), false)

console.log('Response-shape guard passed: valid and malformed payloads covered')
