import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
});
const originalWindow = globalThis.window;
const originalFetch = globalThis.fetch;

const input = {
  destination: { id: "940GZZLUWLO", name: "Waterloo" },
  origin: { name: "Stratford", tflStopPointId: "940GZZLUSTD" },
  arriveBy: "2026-09-07T00:25:00+01:00",
  safetyBufferMinutes: 5,
};

try {
  const { pendingJourneyCopy, scheduleWakeNotice, wakeNoticeDelayMs } =
    await server.ssrLoadModule("/src/components/journey-check-status.ts");
  const { requestJourneyCheck, requestTimeoutMs } =
    await server.ssrLoadModule("/src/api/journey-check.ts");
  const pending = {
    originName: input.origin.name,
    destinationName: input.destination.name,
    arriveBy: input.arriveBy,
    safetyBufferMinutes: String(input.safetyBufferMinutes),
  };
  const copy = pendingJourneyCopy(pending);
  assert.equal(copy.checking, "Checking TfL: Stratford → Waterloo…");
  assert.equal(copy.wakingHeading, "This is taking longer than usual");
  assert.match(copy.wakingBody, /may be waking after inactivity/);
  assert.match(copy.wakingBody, /Stratford → Waterloo/);

  const timers = [];
  const clearedTimers = [];
  globalThis.window = {
    setTimeout(callback, delay) {
      const timer = { callback, delay, cancelled: false };
      timers.push(timer);
      return timer;
    },
    clearTimeout(timer) {
      timer.cancelled = true;
      clearedTimers.push(timer);
    },
  };

  let woke = false;
  const cancelWakeNotice = scheduleWakeNotice(() => {
    woke = true;
  });
  assert.equal(timers.length, 1);
  assert.equal(timers[0].delay, wakeNoticeDelayMs);
  assert.equal(woke, false);
  timers[0].callback();
  assert.equal(woke, true);
  cancelWakeNotice();
  assert.equal(clearedTimers[0], timers[0]);

  timers.length = 0;
  clearedTimers.length = 0;
  let cancelledWake = false;
  const cancelledTimer = scheduleWakeNotice(() => {
    cancelledWake = true;
  });
  cancelledTimer();
  if (!timers[0].cancelled) timers[0].callback();
  assert.equal(cancelledWake, false);
  assert.equal(timers[0].cancelled, true);

  assert.equal(requestTimeoutMs, 75_000);
  timers.length = 0;
  clearedTimers.length = 0;
  let requestSignal;
  globalThis.fetch = (_url, options) => {
    requestSignal = options.signal;
    return new Promise((_, reject) => {
      options.signal.addEventListener(
        "abort",
        () => reject(new DOMException("aborted", "AbortError")),
        { once: true },
      );
    });
  };
  const timeoutRequest = requestJourneyCheck(input);
  await Promise.resolve();
  assert.equal(timers.length, 1);
  assert.equal(timers[0].delay, requestTimeoutMs);
  assert.equal(requestSignal.aborted, false);
  timers[0].callback();
  await assert.rejects(timeoutRequest, /took too long to respond/);
  assert.equal(requestSignal.aborted, true);
  assert.equal(clearedTimers.length, 1);

  timers.length = 0;
  clearedTimers.length = 0;
  let externalListener;
  let externalListenerRemoved = 0;
  const callerSignal = {
    aborted: false,
    addEventListener(_event, listener) {
      externalListener = listener;
    },
    removeEventListener(_event, listener) {
      assert.equal(listener, externalListener);
      externalListenerRemoved += 1;
      externalListener = undefined;
    },
  };
  globalThis.fetch = (_url, options) => {
    requestSignal = options.signal;
    return Promise.resolve(
      new Response(JSON.stringify({ error: { message: "server failed" } }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );
  };
  await assert.rejects(
    requestJourneyCheck(input, callerSignal),
    /server failed/,
  );
  assert.equal(externalListenerRemoved, 1);
  assert.equal(requestSignal.aborted, false);
  externalListener?.();
  assert.equal(requestSignal.aborted, false);

  console.log("Cold-start timing and cleanup checks passed");
} finally {
  globalThis.fetch = originalFetch;
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
  await server.close();
}
