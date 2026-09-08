import assert from 'node:assert/strict'
import {
  formatLineName,
  formatJourneyDuration,
  formatRouteMode,
  formatRouteService,
  getLineColor,
  getRouteDisplayMode,
  getRouteIconKind,
} from '../src/components/route-flow.ts'

assert.equal(formatLineName('Jubilee'), 'Jubilee line')
assert.equal(formatLineName('Jubilee line'), 'Jubilee line')
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
