import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
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
  const { journeyFocusTarget } = await server.ssrLoadModule(
    "/src/journeys/journey-focus.ts",
  );
  assert.equal(journeyFocusTarget("result", true, true, false), "answer",
    "A successful draft check focuses its result even while the form remains editable");
  assert.equal(journeyFocusTarget("form", true, true, false), "form",
    "Explicit review and return planning retain requested field focus");
  assert.equal(journeyFocusTarget("form", true, false, false), "form",
    "A deliberate new journey focuses its requested field");
  assert.equal(journeyFocusTarget("result", false, true, true), "current");
  assert.equal(journeyFocusTarget("page", true, false, false), "page");

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
  assert.match(howToText, /Choose your Tube stations/);
  assert.match(howToText, /starting station and the station to reach/);
  assert.match(howToText, /Check and read the route/);
  assert.match(howToHtml, /<details class="full-guide"><summary>Full guide and limitations/);
  assert.ok(howToHtml.indexOf("Got it, plan my journey") < howToHtml.indexOf('class="full-guide"'));
  assert.match(howToText, /Read the answer/);
  assert.match(howToText, /saved automatically on this browser and device/);
  assert.match(howToText, /Start this journey/);
  assert.match(howToText, /Saved journeys.*Open saved plan/);
  assert.match(howToText, /Plan return journey.*reverses the stations/);
  assert.match(howToText, /Arrive back by/);
  assert.match(howToText, /Resume journey/);
  assert.match(howToText, /no account sync or automatic refresh/i);
  assert.match(howToText, /Read more about last\s+link/);
  assert.match(howToText, /local departure countdown/);
  assert.match(aboutText, /final ten minutes.*local countdown/);

  const mobileNavHtml = renderToStaticMarkup(
    createElement(MobileNav, { currentPage: "journey" }),
  );
  assert.match(mobileNavHtml, /Open navigation/);
  assert.match(mobileNavHtml, /Saved journeys/);
  assert.match(mobileNavHtml, /Where do you want to go\?/);
  assert.match(mobileNavHtml, /lastlink-logo--inverse/);

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
  assert.match(stationPickerHtml, /matching Tube stations/);
  assert.match(stationPickerHtml, /Selected ✓/);
  assert.match(aboutHtml, /aria-label="On this page"/);

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
      onReview: () => {},
      onPlanReturn: () => {},
      onRemove: () => {},
      onEnd: () => {},
    }),
  );
  assert.match(savedHtml, /Saved journeys/);
  assert.match(savedHtml, /Waterloo.*Stratford/);
  assert.match(savedHtml, /Resume journey/);
  assert.ok(savedHtml.indexOf("Resume journey") < savedHtml.indexOf("Plan return journey"));
  assert.match(savedHtml, /Plan return journey/);
  assert.match(savedHtml, /On this browser and device/);
  assert.match(savedHtml, /Deadline.*margin/);
  assert.match(savedHtml, /protected/);
  assert.match(savedHtml, /--saved-route-accent:\s*#a0a5a9/);
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
      onReview: () => {},
      onPlanReturn: () => {},
      onRemove: () => {},
      onEnd: () => {},
    }),
  );
  assert.match(staleHtml, /saved-route__freshness-badge/);
  assert.match(staleHtml, /Needs fresh check/);
  assert.match(staleHtml, /Review and recheck/);
  assert.match(staleHtml, /Review the deadline before checking again/);
  assert.doesNotMatch(staleHtml, /Resume journey/);

  const emptyHtml = renderToStaticMarkup(
    createElement(SavedItemsView, {
      journeys: [],
      activeId: null,
      onResume: () => {},
      onReview: () => {},
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
  assert.match(answerWithNotice, /--decision-accent:\s*#000000/);
  assert.match(answerWithNotice, /--route-accent:\s*#000000/);
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
  const changedDraftError = renderToStaticMarkup(createElement(JourneyView, {
    workspace: {
      editing: true, shown: sampleJourney,
      draft: { ...sampleInput, originName: "Paddington" },
      error: { input: { ...sampleInput, originName: "Paddington" }, message: "Try again shortly." },
      pending: null, active: null, library: { active: null },
    },
    answerRef: { current: null }, onStart() {}, onEnd() {}, onExplore() {}, onStartNew() {},
  }));
  assert.match(changedDraftError, /Your previous plan, Waterloo.*Stratford, is unchanged\./);
  assert.match(changedDraftError, /Your previous result is hidden while you edit this search/);
  assert.doesNotMatch(changedDraftError, /unchanged below|id="answer-title"/);
  const activeView = renderToStaticMarkup(createElement(JourneyView, {
    workspace: {
      editing: false, shown: sampleJourney, draft: sampleInput, error: null,
      pending: null, active: sampleJourney,
      library: { active: { id: sampleJourney.id, legIndex: 0 } },
    },
    answerRef: { current: null }, onStart() {}, onEnd() {}, onExplore() {}, onStartNew() {},
  }));
  assert.match(activeView, /<details class="protected-plan-details"><summary>Plan details/);
  assert.ok(activeView.indexOf('id="current-journey"') < activeView.indexOf('class="protected-plan-details"'));
  assert.ok(activeView.indexOf('class="protected-plan-details"') < activeView.indexOf('class="new-journey-prompt"'));
  assert.match(activeView, /View current step/);
  assert.match(activeView, /--route-accent:\s*#000000/);
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
  assert.match(formSource, /Type to filter, or browse the Tube station list/);
  assert.match(formSource, /futureDeadlinePresets/);
  assert.match(formSource, /min={minimumArriveBy}/);
  assert.match(formSource, /Quick arrival time choices/);
  assert.doesNotMatch(formSource, /onInput=/);
  assert.match(workspaceSource, /defaultDeadlineRef/);
  assert.match(workspaceSource, /defaultDeadlineRollingRef/);
  assert.match(workspaceSource, /setDraft\(\(current\) => draftAfterCheck\(current, snapshot.input, source\)\)\s+setFocusIntent\('result'\)/);
  assert.match(appSource, /journeyFocusTarget\(w.focusIntent, w.editing/);
  for (const name of ["planReturnJourney", "explore", "startNewJourney"]) {
    const body = workspaceSource.split(`function ${name}(`)[1]?.split(/\n  (?:async )?function /)[0];
    assert.match(body, /setFocusIntent\('form'\)/);
    assert.match(body, /setFocusVersion/);
  }
  assert.doesNotMatch(comboboxSource, /requestPlaceSearch/);
  assert.doesNotMatch(comboboxSource, /address|landmark|free-form/i);
  assert.match(appSource, /page === 'saved'/);
  assert.match(appSource, /page === 'about'/);
  assert.ok(appSource.indexOf('className="active-return"') > appSource.indexOf('className="workspace"'));
  assert.ok(appSource.indexOf('className="active-return"') < appSource.indexOf('<JourneyView'));
  const cssSource = readFileSync(new URL("../src/App.css", import.meta.url), "utf8");
  const resumeRule = cssSource.match(/\.active-return \{([^}]+)\}/)?.[1];
  assert.ok(resumeRule);
  assert.doesNotMatch(resumeRule, /position:|bottom:|z-index:/);
  assert.match(cssSource, /prefers-reduced-motion: reduce/);
  assert.match(cssSource, /summary:focus-visible/);
  const dialogSource = readFileSync(new URL("../src/components/useDialogSurface.ts", import.meta.url), "utf8");
  assert.match(dialogSource, /document\.activeElement/);
  assert.match(dialogSource, /target\.isConnected/);
  assert.match(dialogSource, /destination\?\.focus/);
  assert.match(dialogSource, /useEffect\(\(\) => unlock, \[unlock\]\)/);
  assert.doesNotMatch(dialogSource, /useEffect\([^\n]*finish\(false\)/);

  // Execute the real shared hook against a tiny DOM/hook lifecycle double.
  // Native close intentionally does not restore focus, so these assertions test
  // our opener handling across setup -> cleanup -> setup, not browser fallback.
  const dialogJs = ts.transpileModule(dialogSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  for (const surface of ["guide", "route", "mobile navigation", "confirmation"]) {
    const setups = [];
    const document = { body: { style: { overflow: "auto" } }, activeElement: null };
    class Element {
      isConnected = true;
      getClientRects() { return [{}]; }
      focus() { document.activeElement = this; }
    }
    const opener = new Element();
    document.activeElement = opener;
    const module = { exports: {} };
    runInNewContext(dialogJs, {
      exports: module.exports,
      require(name) {
        assert.equal(name, "react");
        return {
          useRef: (current) => ({ current }),
          useCallback: (callback) => callback,
          useEffect: (setup) => setups.push(setup),
        };
      },
      document,
      HTMLElement: Element,
      requestAnimationFrame: (callback) => callback(),
    });
    const hook = module.exports.useDialogSurface();
    hook.dialogRef.current = {
      open: false,
      showModal() { this.open = true; document.activeElement = new Element(); },
      close() { this.open = false; document.activeElement = document.body; },
    };
    const cleanups = setups.map((setup) => setup());
    hook.open();
    cleanups.forEach((cleanup) => cleanup());
    assert.equal(document.body.style.overflow, "auto", `${surface}: cleanup releases scroll lock`);
    const replayCleanups = setups.map((setup) => setup());
    hook.open();
    assert.equal(document.body.style.overflow, "hidden", `${surface}: replay locks open dialog`);
    hook.close();
    assert.equal(document.activeElement, opener, `${surface}: replay preserves original opener`);
    assert.equal(document.body.style.overflow, "auto", `${surface}: close releases scroll lock`);
    opener.focus();
    hook.open();
    replayCleanups.forEach((cleanup) => cleanup());
    assert.equal(document.body.style.overflow, "auto", `${surface}: true unmount releases lock`);
  }

  console.log(
    "Page rendering passed: journey, saved routes and about navigation",
  );
} finally {
  await server.close();
}
