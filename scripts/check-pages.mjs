import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

process.env.TZ = "Europe/London";
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
});
function visibleText(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
try {
  const { AboutView } = await server.ssrLoadModule("/src/views/AboutView.tsx");
  const { HowToUseDialog } = await server.ssrLoadModule(
    "/src/components/HowToUseDialog.tsx",
  );
  const { MobileNav } = await server.ssrLoadModule(
    "/src/components/MobileNav.tsx",
  );
  const { SiteHeader } = await server.ssrLoadModule(
    "/src/components/SiteHeader.tsx",
  );
  const { SavedItemsView } = await server.ssrLoadModule(
    "/src/views/SavedItemsView.tsx",
  );
  const { JourneyView } = await server.ssrLoadModule(
    "/src/views/JourneyView.tsx",
  );
  const { JourneyAnswer } = await server.ssrLoadModule(
    "/src/components/JourneyAnswer.tsx",
  );
  const { CurrentJourney } = await server.ssrLoadModule(
    "/src/components/CurrentJourney.tsx",
  );
  const { StationCombobox } = await server.ssrLoadModule(
    "/src/components/StationCombobox.tsx",
  );

  const aboutHtml = renderToStaticMarkup(createElement(AboutView));
  const aboutText = visibleText(aboutHtml);
  assert.match(aboutText, /A clear plan for the last link/);
  assert.match(aboutText, /Plan a journey in four steps/);
  assert.match(aboutText, /Saved journeys/);
  assert.match(aboutText, /Plan return journey/);
  assert.match(aboutText, /Arrive back by/);
  assert.match(aboutText, /Freshness and provider evidence/);
  assert.match(aboutText, /What last\s+link does not promise/);
  assert.match(aboutText, /Use it safely/);

  const howToHtml = renderToStaticMarkup(createElement(HowToUseDialog));
  const howToText = visibleText(howToHtml);
  assert.match(howToText, /How to use last\s+link/);
  assert.match(howToText, /Choose your starting Tube station/);
  assert.match(howToText, /Choose the station you need/);
  assert.match(howToText, /Check my route/);
  assert.match(howToText, /Read the answer/);
  assert.match(howToText, /saved automatically on this browser and device/);
  assert.match(howToText, /Start this journey/);
  assert.match(howToText, /Saved journeys.*Open saved plan/);
  assert.match(howToText, /Plan return journey.*reverses the stations/);
  assert.match(howToText, /Arrive back by/);
  assert.match(howToText, /Back to my journey/);
  assert.match(howToText, /no account sync or automatic refresh/i);
  assert.match(howToText, /Read more about last\s+link/);

  const mobileNavHtml = renderToStaticMarkup(
    createElement(MobileNav, { currentPage: "journey" }),
  );
  assert.match(mobileNavHtml, /Open navigation/);
  assert.match(mobileNavHtml, /Saved journeys/);
  assert.match(mobileNavHtml, /Where do you want to go\?/);

  const stationPickerHtml = renderToStaticMarkup(
    createElement(StationCombobox, {
      id: "origin",
      label: "Starting point",
      value: "Waterloo",
      placeholder: "Where are you starting?",
      helpText: "Choose a Tube station from the TfL list",
      describedBy: "origin-help",
      invalid: false,
      openPickerId: "origin",
      onOpen: () => {},
      onClose: () => {},
      onChange: () => {},
    }),
  );
  assert.match(
    stationPickerHtml,
    /Waterloo/,
  );

  const siteHeaderHtml = renderToStaticMarkup(
    createElement(SiteHeader, { currentPage: "journey" }),
  );
  assert.match(siteHeaderHtml, /lastlink-logo/);
  assert.match(siteHeaderHtml, /href="#\/saved"/);
  assert.match(siteHeaderHtml, /href="#\/about"/);

  const journeys = [
    {
      id: "test-route",
      savedAt: "2026-09-11T13:00:00.000Z",
      input: {
        originName: "Waterloo",
        destinationName: "Stratford",
        arriveBy: "2030-09-11T20:00",
        safetyBufferMinutes: "5",
      },
      response: {
        status: "viable",
        checkedAt: "2030-09-11T18:00:00Z",
        route: {
          arrivalAt: "2030-09-11T18:45:00Z",
          legs: [{ mode: "tube", lineName: "Jubilee" }],
        },
      },
    },
  ];
  const savedHtml = renderToStaticMarkup(
    createElement(SavedItemsView, {
      journeys,
      activeId: journeys[0].id,
      onResume: () => {},
      onPlanReturn: () => {},
      onRemove: () => {},
      onEnd: () => {},
    }),
  );
  assert.match(savedHtml, /Saved journeys/);
  assert.match(savedHtml, /Waterloo.*Stratford/);
  assert.match(savedHtml, /Return to my journey/);
  assert.match(savedHtml, /Plan return journey/);
  assert.match(savedHtml, /On this browser and device/);
  assert.match(savedHtml, /Deadline.*margin/);
  assert.match(savedHtml, /protected/);
  assert.doesNotMatch(savedHtml, /saved-route__freshness-badge/);

  const staleHtml = renderToStaticMarkup(
    createElement(SavedItemsView, {
      journeys: [
        {
          ...journeys[0],
          input: { ...journeys[0].input, arriveBy: "2020-09-11T20:00" },
        },
      ],
      activeId: null,
      onResume: () => {},
      onPlanReturn: () => {},
      onRemove: () => {},
      onEnd: () => {},
    }),
  );
  assert.match(staleHtml, /saved-route__freshness-badge/);
  assert.match(staleHtml, /Needs fresh check/);

  const emptyHtml = renderToStaticMarkup(
    createElement(SavedItemsView, {
      journeys: [],
      activeId: null,
      onResume: () => {},
      onPlanReturn: () => {},
      onRemove: () => {},
    }),
  );
  assert.match(emptyHtml, /No saved journeys yet/);
  assert.match(emptyHtml, /Plan a journey/);
  assert.match(savedHtml, /End journey/);

  const sampleInput = journeys[0].input;
  const baseLeg = {
    mode: "tube",
    from: "Kennington",
    to: "Waterloo",
    lineName: "Northern",
    departureAt: "2030-09-11T18:10:00Z",
    arrivalAt: "2030-09-11T18:20:00Z",
    durationMinutes: 10,
    notices: [{ kind: "disruption", text: "Use the northbound platform." }],
  };
  const sampleJourney = {
    ...journeys[0],
    response: {
      ...journeys[0].response,
      dataMode: "fixture",
      summary: "Fixture plan",
      nextAction: "Follow signs",
      deadline: { arriveBy: "2030-09-11T19:00:00Z" },
      margin: null,
      reasons: [],
      evidence: [],
      warnings: [],
      stationOnlyWarning: "Station arrival only.",
      route: { arrivalAt: baseLeg.arrivalAt, legs: [baseLeg] },
    },
  };
  const answerWithNotice = renderToStaticMarkup(
    createElement(JourneyAnswer, {
      response: sampleJourney.response,
      currentInput: sampleJourney.input,
      onStart: () => {},
    }),
  );
  const visibleNoticeIndex = answerWithNotice.indexOf(
    "answer-service-notices",
  );
  const routeDialogIndex = answerWithNotice.indexOf("<dialog");
  assert.ok(visibleNoticeIndex >= 0 && visibleNoticeIndex < routeDialogIndex);
  for (const message of [
    "The check took too long. Please try again.",
    "The journey service could not be reached. Please try again.",
    "TfL could not complete this check. Try again shortly.",
  ]) {
    const view = renderToStaticMarkup(
      createElement(JourneyView, {
        workspace: {
          editing: false,
          shown: sampleJourney,
          draft: { ...sampleInput, originName: "Paddington" },
          error: { input: sampleInput, message },
          pending: null,
          active: null,
          library: { active: null },
        },
        answerRef: { current: null },
        onStart: () => {},
        onEnd: () => {},
        onExplore: () => {},
        onStartNew: () => {},
      }),
    );
    assert.ok(
      view.includes(message),
      "Saved-plan recheck errors remain visible without the form",
    );
    assert.match(view, /role="alert"/);
    assert.match(view, /Your previous plan, Waterloo.*Stratford, is unchanged/);
    assert.match(view, /Start a new journey/);
  }
  const waitingView = renderToStaticMarkup(
    createElement(JourneyView, {
      workspace: {
        editing: false,
        shown: sampleJourney,
        draft: sampleInput,
        error: null,
        pending: sampleInput,
        active: null,
        library: { active: null },
      },
      answerRef: { current: null },
      onStart: () => {},
      onEnd: () => {},
      onExplore: () => {},
      onStartNew: () => {},
    }),
  );
  assert.match(waitingView, /Checking TfL: Waterloo.*Stratford/);
  for (const nextLine of ["Northern", "Bakerloo"]) {
    const currentHtml = renderToStaticMarkup(
      createElement(CurrentJourney, {
        journey: {
          ...sampleJourney,
          response: {
            ...sampleJourney.response,
            route: {
              legs: [
                {
                  ...baseLeg,
                  from: "Oval",
                  to: "Kennington",
                  directions: ["Northern towards High Barnet via Bank"],
                },
                {
                  ...baseLeg,
                  lineName: nextLine,
                  directions: [
                    nextLine + " towards High Barnet via Charing Cross",
                  ],
                  notices: [
                    {
                      kind: "service",
                      text: "Required access is unavailable.",
                    },
                  ],
                },
              ],
            },
          },
        },
        legIndex: 1,
        onLeg: () => {},
        onReplan: () => {},
        onEnd: () => {},
      }),
    );
    assert.match(
      currentHtml,
      nextLine === "Northern"
        ? /Same line, different branch.*Get off here and board/
        : /Change lines at Kennington/,
    );
    assert.ok(
      currentHtml.indexOf("Required access is unavailable") <
        currentHtml.indexOf("<h2"),
      "Notice precedes boarding direction",
    );
  }

  const appSource = readFileSync(
    new URL("../src/App.tsx", import.meta.url),
    "utf8",
  );
  const formSource = readFileSync(
    new URL("../src/components/JourneyForm.tsx", import.meta.url),
    "utf8",
  );
  const comboboxSource = readFileSync(
    new URL("../src/components/StationCombobox.tsx", import.meta.url),
    "utf8",
  );
  const aboutSource = readFileSync(
    new URL("../src/views/AboutView.tsx", import.meta.url),
    "utf8",
  );
  const journeySource = readFileSync(
    new URL("../src/views/JourneyView.tsx", import.meta.url),
    "utf8",
  );
  const savedSource = readFileSync(
    new URL("../src/views/SavedItemsView.tsx", import.meta.url),
    "utf8",
  );
  const workspaceSource = readFileSync(
    new URL("../src/journeys/useJourneyWorkspace.ts", import.meta.url),
    "utf8",
  );
  assert.match(journeySource, /Reach your station in time/);
  assert.doesNotMatch(journeySource, /Late-night journey check/);
  assert.match(aboutSource, /station-arrival deadline/);
  assert.doesNotMatch(aboutSource, /late-night/i);
  assert.match(journeySource, /CurrentJourney/);
  assert.match(journeySource, /onStartNew/);
  assert.match(workspaceSource, /function startNewJourney/);
  assert.match(workspaceSource, /originName: ''/);
  assert.match(workspaceSource, /useState<SavedJourney \| null>\(null\)/);
  assert.match(
    workspaceSource,
    /useState<JourneyInput>\(\(\) => \(\{/,
  );
  assert.match(savedSource, /Saved journeys/);
  assert.match(savedSource, /onPlanReturn/);
  assert.match(savedSource, /Plan return journey/);
  assert.match(workspaceSource, /function planReturnJourney/);
  assert.match(journeySource, /returnFrom=/);
  assert.match(
    appSource,
    /<SiteHeader currentPage=\{page\} onJourneyHome=\{startNewJourney\} \/>/,
  );
  assert.match(formSource, /Choose a Tube station from the TfL list/);
  assert.match(formSource, /Tube station only — choose from the TfL list/);
  assert.match(formSource, /futureDeadlinePresets/);
  assert.match(formSource, /min={minimumArriveBy}/);
  assert.match(formSource, /Quick arrival time choices/);
  assert.doesNotMatch(formSource, /onInput=/);
  assert.match(workspaceSource, /defaultDeadlineRef/);
  assert.match(workspaceSource, /defaultDeadlineRollingRef/);
  assert.doesNotMatch(comboboxSource, /requestPlaceSearch/);
  assert.doesNotMatch(comboboxSource, /address|landmark|free-form/i);
  assert.match(appSource, /page === 'saved'/);
  assert.match(appSource, /page === 'about'/);

  console.log(
    "Page rendering passed: journey, saved routes and about navigation",
  );
} finally {
  await server.close();
}
