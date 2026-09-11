import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

// Load the real component through the same JSX pipeline as the application.
// Middleware mode avoids binding a port or contacting the API.
process.env.TZ = 'Europe/London'
const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
try {
  const { JourneyAnswer } = await server.ssrLoadModule('/src/components/JourneyAnswer.tsx')
  const { JourneyForm } = await server.ssrLoadModule('/src/components/JourneyForm.tsx')
  const formHtml = renderToStaticMarkup(createElement(JourneyForm, {
    onResponse: () => {},
    onRequestStart: () => {},
  }))
  assert.match(formHtml, /id="origin"[^>]*value="Waterloo"/)
  assert.match(formHtml, /id="destination"[^>]*value="Stratford"/)
  const response = {
    status: 'not_viable', dataMode: 'fixture', summary: 'This itinerary has departed.',
    nextAction: 'Check a later journey.', stationOnlyWarning: 'Station arrival only.',
    margin: null, evidence: [], warnings: [],
    route: {
      alternativeRoute: true, arrivalAt: '2026-09-11T00:15:00+01:00',
      legs: [{ mode: 'tube', lineName: 'Jubilee', from: 'Waterloo', to: 'Stratford',
        departureAt: '2026-09-10T23:45:00+01:00', arrivalAt: '2026-09-11T00:15:00+01:00',
        durationMinutes: 30,
        notices: [{ kind: 'disruption', text: 'Service disrupted.' }, { kind: 'planned_work', text: 'Platform works.' }],
      }],
      alternatives: [{
        departureAt: '2026-09-11T23:45:00+01:00', arrivalAt: '2026-09-12T00:15:00+01:00',
        durationMinutes: 30, remainingAfterBufferMinutes: -0.4, segments: [{ mode: 'tube', lineName: 'Jubilee' }],
      }],
    },
  }
  const html = renderToStaticMarkup(createElement(JourneyAnswer, { response }))
  assert.match(html, /Other routes found \(1\)/)
  assert.match(html, /11 Sept 2026 to 12 Sept 2026/)
  assert.match(html, /1 minute short of buffer/)
  assert.match(html, /This itinerary has departed/)
  assert.doesNotMatch(html, /best fit/)
  assert.match(html, /Service disrupted/)
  assert.match(html, /Platform works/)
  assert.match(html, /Walking time not supplied/)
  assert.match(html, /assessment above applies to the detailed route below/)
  for (const minutes of [0, 1, 8]) {
    const walking = structuredClone(response)
    walking.route.alternatives[0].walkingMinutes = minutes
    const walkingHtml = renderToStaticMarkup(createElement(JourneyAnswer, { response: walking }))
    assert.ok(walkingHtml.includes(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'} walking`))
    assert.doesNotMatch(walkingHtml, /Walking time not supplied/)
  }
  const singleDate = structuredClone(response)
  singleDate.route.alternatives[0].departureAt = '2026-09-12T00:00:00+01:00'
  const sameDayHtml = renderToStaticMarkup(createElement(JourneyAnswer, { response: singleDate }))
  assert.match(sameDayHtml, /12 Sept 2026 · TfL Journey Planner estimate/)
  assert.doesNotMatch(sameDayHtml, /11 Sept 2026 to 12 Sept 2026/)
  delete singleDate.route.alternatives
  delete singleDate.route.alternativeRoute
  const noAlternatives = renderToStaticMarkup(createElement(JourneyAnswer, { response: singleDate }))
  assert.doesNotMatch(noAlternatives, /Other routes found|alternative itinerary/)
  const originalNow = Date.now
  try {
    const positive = structuredClone(response)
    positive.status = 'viable'
    positive.summary = 'A route met your buffer.'
    positive.nextAction = 'Leave now and follow the evaluated route.'
    const departure = Date.parse(positive.route.legs[0].departureAt)
    Date.now = () => departure - 1000
    assert.doesNotMatch(renderToStaticMarkup(createElement(JourneyAnswer, { response: positive })), /Recheck before starting/)
    Date.now = () => departure + 1000
    const elapsed = renderToStaticMarkup(createElement(JourneyAnswer, { response: positive }))
    assert.match(elapsed, /Recheck before starting/)
    assert.match(elapsed, /already travelling/)
    assert.doesNotMatch(elapsed, /Leave now and follow/)
    positive.status = 'unable_to_verify'
    assert.doesNotMatch(renderToStaticMarkup(createElement(JourneyAnswer, { response: positive })), /Recheck before starting/)
  } finally {
    Date.now = originalNow
  }
  console.log('Answer rendering passed: overnight dates, shortfall, fallback and notices')
} finally {
  await server.close()
}
