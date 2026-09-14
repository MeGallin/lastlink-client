import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

// Load the real component through the same JSX pipeline as the application.
// Middleware mode avoids binding a port or contacting the API.
process.env.TZ = 'Europe/London'
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
})
try {
  const { JourneyAnswer } = await server.ssrLoadModule('/src/components/JourneyAnswer.tsx')
  const { JourneyForm } = await server.ssrLoadModule('/src/components/JourneyForm.tsx')
  const formHtml = renderToStaticMarkup(
    createElement(JourneyForm, {
      values: {
        originName: 'Waterloo',
        destinationName: 'Stratford',
        arriveBy: '2030-09-11T20:00',
        safetyBufferMinutes: '5',
      },
      onChange: () => {},
      onCheck: () => {},
      pending: null,
      error: null,
    }),
  )
  assert.match(formHtml, /id="origin"[^>]*value="Waterloo"/)
  assert.match(formHtml, /id="destination"[^>]*value="Stratford"/)
  assert.match(formHtml, /id="arriveBy"[^>]*min="[^"]+"/)
  assert.match(formHtml, /Be at the destination station by this time\. Enter UK time; results are shown in London time/)
  assert.match(formHtml, /Quick choices/)
  assert.match(formHtml, /In 30 minutes/)
  assert.match(formHtml, /Tomorrow at 09:00/)
  assert.doesNotMatch(formHtml, /onInput=/)
  const staleFormHtml = renderToStaticMarkup(
    createElement(JourneyForm, {
      values: {
        originName: 'Waterloo',
        destinationName: 'Stratford',
        arriveBy: '2000-09-11T20:00',
        safetyBufferMinutes: '5',
      },
      onChange: () => {},
      onCheck: () => {},
      pending: null,
      error: null,
    }),
  )
  assert.match(staleFormHtml, /This deadline has passed\. Choose a future time before checking\./)
  assert.match(staleFormHtml, /id="arriveBy"[^>]*aria-invalid="true"/)
  const response = {
    status: 'not_viable',
    dataMode: 'fixture',
    summary: 'This itinerary has departed.',
    nextAction: 'Check a later journey.',
    stationOnlyWarning: 'Station arrival only.',
    margin: null,
    evidence: [],
    warnings: [],
    route: {
      alternativeRoute: true,
      arrivalAt: '2026-09-11T00:15:00+01:00',
      legs: [
        {
          mode: 'tube',
          lineName: 'Jubilee',
          from: 'Waterloo',
          to: 'Stratford',
          departureAt: '2026-09-10T23:45:00+01:00',
          arrivalAt: '2026-09-11T00:15:00+01:00',
          durationMinutes: 30,
          stopCount: 3,
          intermediateStops: [{ name: 'Southwark' }, { name: 'London Bridge' }],
          scheduledDepartureAt: '2026-09-10T23:46:00+01:00',
          scheduledArrivalAt: '2026-09-11T00:16:00+01:00',
          notices: [
            { kind: 'disruption', text: 'Service disrupted.' },
            { kind: 'planned_work', text: 'Platform works.' },
          ],
        },
      ],
      alternatives: [
        {
          departureAt: '2026-09-11T23:45:00+01:00',
          arrivalAt: '2026-09-12T00:15:00+01:00',
          durationMinutes: 30,
          remainingAfterBufferMinutes: -0.4,
          segments: [{ mode: 'tube', lineName: 'Jubilee' }],
        },
      ],
    },
  }
  const html = renderToStaticMarkup(
    createElement(JourneyAnswer, {
      response,
    }),
  )
  assert.match(html, /Assessment at last check/)
  assert.match(html, /saved estimate, not live tracking/)
  assert.ok(html.indexOf('class="next-action"') < html.indexOf('class="route-summary"'))
  assert.doesNotMatch(html, /class="answer-facts"/)
  assert.doesNotMatch(html, /Saved on this device|Forget saved route/)
  assert.match(html, /Other options \(1\) · summaries only/)
  assert.match(html, /11 Sept 2026 to 12 Sept 2026/)
  assert.match(html, /1 minute short of buffer/)
  assert.match(html, /This itinerary has departed/)
  assert.doesNotMatch(html, /best fit/)
  assert.match(html, /assessment above applies to the detailed route below/)
  assert.doesNotMatch(html, /View route steps/)
  const detailResponse = structuredClone(response)
  detailResponse.status = 'viable'
  const detailHtml = renderToStaticMarkup(
    createElement(JourneyAnswer, { response: detailResponse, isActive: true }),
  )
  assert.match(detailHtml, /Service disrupted/)
  assert.match(detailHtml, /Platform works/)
  assert.match(detailHtml, /View service details/)
  assert.match(detailHtml, /route-disclosure-chevron/)
  assert.match(detailHtml, /route-step-details route-step-details--has-notices/)
  assert.match(detailHtml, /Expected journey/)
  assert.match(detailHtml, /Published schedule/)
  assert.match(detailHtml, /3 stops to Stratford/)
  assert.match(detailHtml, /Southwark/)
  assert.match(detailHtml, /Stop 3 · Get off here/)
  assert.match(detailHtml, /Jubilee line station sequence/)
  assert.match(detailHtml, /Walking time not supplied/)
  for (const minutes of [0, 1, 8]) {
    const walking = structuredClone(response)
    walking.route.alternatives[0].walkingMinutes = minutes
    walking.status = 'viable'
    const walkingHtml = renderToStaticMarkup(
      createElement(JourneyAnswer, { response: walking, isActive: true }),
    )
    assert.ok(walkingHtml.includes(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'} walking`))
    assert.doesNotMatch(walkingHtml, /Walking time not supplied/)
  }
  const walkingInstructions = structuredClone(response)
  walkingInstructions.status = 'viable'
  walkingInstructions.route.legs[0] = {
    ...walkingInstructions.route.legs[0],
    mode: 'walk',
    instructions: {
      summary: 'Walk to the station',
      detailed: 'Walk to the station',
      steps: [
        'for 13 metres',
        '2 for 14 meters',
        'on to Station Road, continue for 12 metres',
        '3 for 1 m',
      ],
    },
  }
  const walkingInstructionsHtml = renderToStaticMarkup(
    createElement(JourneyAnswer, { response: walkingInstructions, isActive: true }),
  )
  assert.match(walkingInstructionsHtml, /Walking guidance/)
  assert.match(walkingInstructionsHtml, /route-disclosure-chevron/)
  assert.match(walkingInstructionsHtml, /About 40 metres of walking in total/)
  assert.match(walkingInstructionsHtml, /on to Station Road, continue for 12 metres/)
  assert.doesNotMatch(walkingInstructionsHtml, /Walk 13 metres|Walk 14 metres|Walk 1 metre/)
  assert.doesNotMatch(walkingInstructionsHtml, /2 for 14 meters|3 for 1 m/)
  assert.equal(walkingInstructionsHtml.match(/Walk to the station/g)?.length, 1)
  const singleDate = structuredClone(response)
  singleDate.route.alternatives[0].departureAt = '2026-09-12T00:00:00+01:00'
  const sameDayHtml = renderToStaticMarkup(createElement(JourneyAnswer, { response: singleDate }))
  assert.match(sameDayHtml, /12 Sept 2026 · TfL Journey Planner estimate/)
  assert.doesNotMatch(sameDayHtml, /11 Sept 2026 to 12 Sept 2026/)
  delete singleDate.route.alternatives
  delete singleDate.route.alternativeRoute
  const noAlternatives = renderToStaticMarkup(
    createElement(JourneyAnswer, { response: singleDate }),
  )
  assert.doesNotMatch(noAlternatives, /Other options|alternative itinerary/)
  const originalNow = Date.now
  try {
    const positive = structuredClone(response)
    positive.status = 'viable'
    positive.summary = 'A route met your buffer.'
    positive.nextAction = 'Leave now and follow the evaluated route.'
    const departure = Date.parse(positive.route.legs[0].departureAt)
    Date.now = () => departure - 1000
    const viableHtml = renderToStaticMarkup(createElement(JourneyAnswer, { response: positive }))
    assert.doesNotMatch(viableHtml, /Recheck before starting/)
    assert.match(viableHtml, /View route steps/)
    assert.match(viableHtml, /Viable route/)
    Date.now = () => departure + 1000
    const elapsed = renderToStaticMarkup(
      createElement(JourneyAnswer, {
        response: positive,
        currentInput: {
          originName: 'Waterloo',
          destinationName: 'Stratford',
          arriveBy: '2026-09-10T23:30',
          safetyBufferMinutes: '5',
        },
        onReview: () => {},
      }),
    )
    assert.match(elapsed, /Recheck before starting/)
    assert.match(elapsed, /already travelling/)
    assert.match(elapsed, /Review stations and deadline/)
    assert.doesNotMatch(elapsed, /one hour from now|Check with a fresh arrival time|live data/)
    assert.match(elapsed, /previous deadline has passed/)
    assert.doesNotMatch(elapsed, /Leave now and follow/)
    assert.doesNotMatch(elapsed, /View route steps/)
    positive.status = 'unable_to_verify'
    assert.doesNotMatch(
      renderToStaticMarkup(createElement(JourneyAnswer, { response: positive })),
      /Recheck before starting/,
    )
  } finally {
    Date.now = originalNow
  }
  console.log('Answer rendering passed: overnight dates, shortfall, fallback and notices')
} finally {
  await server.close()
}
