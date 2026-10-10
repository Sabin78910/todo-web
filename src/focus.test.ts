import { BREAK_MS, FOCUS_MS, createTimer, pause, remaining, reset, start, tick } from "./focus";

test("defaults to a 25 minute focus and 5 minute break, idle", () => {
  expect(FOCUS_MS).toBe(25 * 60_000);
  expect(BREAK_MS).toBe(5 * 60_000);
  const t = createTimer("focus");
  expect(t.status).toBe("idle");
  expect(remaining(t, 123)).toBe(FOCUS_MS);
  expect(createTimer("break").durationMs).toBe(BREAK_MS);
});

test("remaining is computed from timestamps, so skipped ticks stay correct", () => {
  const t = start(createTimer("focus"), 1000);
  expect(t.status).toBe("running");
  expect(remaining(t, 1000 + 10 * 60_000)).toBe(FOCUS_MS - 10 * 60_000);
});

test("pause freezes remaining and start resumes from it", () => {
  let t = start(createTimer("focus"), 0);
  t = pause(t, 60_000);
  expect(t.status).toBe("paused");
  expect(remaining(t, 999_999)).toBe(FOCUS_MS - 60_000);
  t = start(t, 500_000);
  expect(remaining(t, 560_000)).toBe(FOCUS_MS - 120_000);
});

test("pause on a non-running timer and start on a running one are no-ops", () => {
  const idle = createTimer("focus");
  expect(pause(idle, 5)).toBe(idle);
  const running = start(idle, 0);
  expect(start(running, 10)).toBe(running);
});

test("reset returns to idle with full duration", () => {
  const t = reset(pause(start(createTimer("focus"), 0), 5000));
  expect(t.status).toBe("idle");
  expect(remaining(t, 1e9)).toBe(FOCUS_MS);
});

test("tick marks the timer done once time is up and never goes negative", () => {
  const t = start(createTimer("break"), 0);
  expect(tick(t, BREAK_MS - 1)).toBe(t);
  const done = tick(t, BREAK_MS + 5000);
  expect(done.status).toBe("done");
  expect(remaining(done, BREAK_MS + 99999)).toBe(0);
  expect(tick(createTimer("focus"), 1e12).status).toBe("idle");
});
