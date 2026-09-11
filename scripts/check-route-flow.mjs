import assert from 'node:assert/strict'
import { currentEvidenceAge, formatEvidenceAge } from '../src/components/evidence-age.ts'

const captured = '2026-09-10T20:00:00Z'
const at = Date.parse(captured)
assert.equal(currentEvidenceAge(10, captured, at + 125000), 135)
assert.equal(currentEvidenceAge(90, captured, at + 120000), 210)
assert.equal(currentEvidenceAge(90, captured, at - 60000), 90)
assert.equal(currentEvidenceAge(null, captured, at + 125000), null)
assert.equal(formatEvidenceAge(59), 'less than a minute old')
assert.equal(formatEvidenceAge(60), '1 minute old')
assert.equal(formatEvidenceAge(125), '2 minutes old')
assert.equal(formatEvidenceAge(null), 'age unavailable')
import {
  formatLineName,
  formatAlternativeServices,
  formatAlternativeMargin,
  formatJourneyDuration,
  formatRouteDirection,
  formatRouteDirectionText,
  formatRouteMode,
  formatRouteService,
  getLineColor,
  getRouteChange,
  getRouteDisplayMode,
  getRouteIconKind,
  providerScheduleMatchesItinerary,
} from '../src/components/route-flow.ts'

assert.equal(formatLineName('Jubilee'), 'Jubilee line')
assert.equal(formatAlternativeServices([{ mode: 'walk' }, { mode: 'tube', lineName: 'Jubilee' }, { mode: 'walk' }]), 'Jubilee line')
assert.equal(formatAlternativeServices([{ mode: 'walk' }]), 'Walking only')
assert.equal(formatAlternativeServices([{ mode: 'tube', lineName: 'Waterloo & City' }, { mode: 'walk' }, { mode: 'tube', lineName: 'Central' }]), 'Waterloo & City line → Central line')
assert.equal(formatAlternativeMargin(-0.4), '1 minute short of buffer')
assert.equal(formatAlternativeMargin(-1.2), '2 minutes short of buffer')
assert.equal(formatAlternativeMargin(0), '0 minutes after buffer')
assert.equal(formatAlternativeMargin(1.9), '1 minute after buffer')
assert.equal(formatLineName('Jubilee line'), 'Jubilee line')
assert.equal(
  formatRouteDirection('Stanmore Underground Station'),
  'Stanmore Underground Station',
)
assert.equal(formatRouteDirection('Towards Stanmore'), 'Towards Stanmore')
assert.equal(formatRouteDirection('westbound'), 'westbound')
assert.equal(formatRouteDirection('via Baker Street'), 'via Baker Street')
assert.equal(
  formatRouteDirectionText(
    ['Stanmore Underground Station'],
    'Jubilee line towards Stanmore',
  ),
  'Jubilee line towards Stanmore',
)
assert.equal(
  formatRouteDirectionText(
    ['Stanmore Underground Station'],
    'Jubilee line to Waterloo',
  ),
  'Stanmore Underground Station',
)
assert.equal(formatRouteDirectionText(['westbound']), 'westbound')
assert.equal(formatRouteDirectionText(undefined, 'Take the Jubilee line'), undefined)

const northernViaBank = {
  mode: 'tube',
  lineName: 'Northern',
  directions: ['Northern line towards High Barnet Station via Bank'],
  from: 'Stockwell Underground Station',
  to: 'Kennington Underground Station',
}
const northernViaCharingCross = {
  mode: 'tube',
  lineName: 'Northern line',
  directions: ['Northern line towards High Barnet Station via Charing Cross'],
  from: 'Kennington Underground Station',
  to: 'Waterloo Underground Station',
}
const branchChange = getRouteChange(northernViaBank, northernViaCharingCross)
assert.equal(branchChange?.kind, 'branch')
assert.equal(branchChange?.at, 'Kennington Underground Station')
assert.equal(branchChange?.title, 'Change trains at Kennington Underground Station')
assert.equal(
  branchChange?.description,
  'Same line, different branch. Get off here and board the next train in the direction shown below.',
)
assert.equal(
  branchChange?.nextDirection,
  'Northern line towards High Barnet Station via Charing Cross',
)

const sameDirectionContinuation = getRouteChange(northernViaBank, {
  ...northernViaCharingCross,
  directions: northernViaBank.directions,
})
assert.equal(sameDirectionContinuation, undefined)

const unknownLineDirectionChange = getRouteChange(
  { ...northernViaBank, lineName: undefined },
  { ...northernViaCharingCross, lineName: undefined },
)
assert.equal(unknownLineDirectionChange, undefined)

const jubileeAfterNorthern = getRouteChange(northernViaBank, {
  ...northernViaCharingCross,
  lineName: 'Jubilee',
  directions: ['Jubilee line towards Stanmore'],
})
assert.equal(jubileeAfterNorthern?.kind, 'line')
assert.equal(
  providerScheduleMatchesItinerary(
    '2026-09-09T10:50:00+01:00',
    '2026-09-09T10:53:00+01:00',
    '2026-09-09T10:50:00+01:00',
    '2026-09-09T10:53:00+01:00',
  ),
  true,
)
assert.equal(
  providerScheduleMatchesItinerary(
    '2026-09-09T10:50:00+01:00',
    '2026-09-09T10:53:00+01:00',
    '2026-09-09T10:51:00+01:00',
    '2026-09-09T10:54:00+01:00',
  ),
  false,
)
assert.equal(
  providerScheduleMatchesItinerary(
    '2026-09-09T10:50:00+01:00',
    '2026-09-09T10:53:00+01:00',
    undefined,
    '2026-09-09T10:53:00+01:00',
  ),
  false,
)
assert.equal(getLineColor('Jubilee'), '#a0a5a9')
assert.equal(getLineColor('Jubilee line'), '#a0a5a9')
assert.equal(getRouteIconKind('walk'), 'walk')
assert.equal(getRouteIconKind('tube'), 'tube')
assert.equal(getRouteIconKind('bus'), 'bus')
assert.equal(getRouteIconKind('rail'), 'rail')
assert.equal(getRouteIconKind('overground'), 'rail')
assert.equal(getRouteIconKind('other'), 'other')
assert.equal(getRouteDisplayMode('other', 'Jubilee'), 'tube')
assert.equal(getRouteDisplayMode('other', 'Express bus A8'), 'bus')
assert.equal(getRouteDisplayMode('overground'), 'overground')
assert.equal(getRouteDisplayMode('other', 'London Overground'), 'overground')
assert.equal(formatRouteMode('overground'), 'Overground')
assert.equal(getRouteIconKind('other', 'Express bus A8'), 'bus')
assert.equal(formatRouteMode('other', 'Express bus A8'), 'Bus')
assert.equal(
  formatRouteService('other', 'Express bus A8'),
  'Bus: Express bus A8',
)
assert.equal(
  formatJourneyDuration('2026-09-08T20:28:00Z', '2026-09-08T20:55:00Z'),
  '27 min 00 sec',
)
assert.equal(
  formatJourneyDuration('2026-09-08T20:28:30Z', '2026-09-08T20:55:05Z'),
  '26 min 35 sec',
)

console.log('Route-flow guard passed: line names, colours and icon fallbacks covered')
