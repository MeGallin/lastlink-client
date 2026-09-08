import assert from 'node:assert/strict'
import {
  formatLineName,
  formatJourneyDuration,
  getLineColor,
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
assert.equal(
  formatJourneyDuration('2026-09-08T20:28:00Z', '2026-09-08T20:55:00Z'),
  '27 min 00 sec',
)
assert.equal(
  formatJourneyDuration('2026-09-08T20:28:30Z', '2026-09-08T20:55:05Z'),
  '26 min 35 sec',
)

console.log('Route-flow guard passed: line names, colours and icon fallbacks covered')
