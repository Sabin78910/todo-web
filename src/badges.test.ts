import { BADGES, type BadgeContext, loadBadges, newlyUnlocked, saveBadges } from "./badges";
import { DEFAULT_GOAL, type Rewards } from "./rewards";

const rewards: Rewards = { points: 0, goal: DEFAULT_GOAL, day: "2026-01-10", doneToday: 0, awarded: [], metDays: [], best: 0 };
const todo = { id: "1", text: "a", done: true };
const ctx = (over: Partial<BadgeContext> = {}): BadgeContext => ({ rewards, todos: [todo, { ...todo, id: "2", done: false }], today: "2026-01-10", hour: 12, ...over });
const ids = (c: BadgeContext, have: string[] = []) => newlyUnlocked(have, c);

test("nothing unlocks with no progress", () => {
  expect(ids(ctx())).toEqual([]);
});

test("first task", () => {
  expect(ids(ctx({ rewards: { ...rewards, awarded: ["1"] } }))).toEqual(["first-task"]);
});

test("3-day and 7-day streak", () => {
  const days = (n: number) => Array.from({ length: n }, (_, i) => `2026-01-${String(10 - i).padStart(2, "0")}`);
  expect(ids(ctx({ rewards: { ...rewards, metDays: days(2) } }))).toEqual([]);
  expect(ids(ctx({ rewards: { ...rewards, metDays: days(3) } }))).toEqual(["streak-3"]);
  expect(ids(ctx({ rewards: { ...rewards, metDays: days(7) } }))).toEqual(["streak-3", "streak-7"]);
});

test("50 tasks done", () => {
  const awarded = Array.from({ length: 50 }, (_, i) => `t${i}`);
  expect(ids(ctx({ rewards: { ...rewards, awarded: awarded.slice(0, 49) } }))).not.toContain("tasks-50");
  expect(ids(ctx({ rewards: { ...rewards, awarded } }))).toContain("tasks-50");
});

test("early bird before 9 am only", () => {
  expect(ids(ctx({ hour: 8 }))).toEqual(["early-bird"]);
  expect(ids(ctx({ hour: 9 }))).toEqual([]);
});

test("all done today needs a non-empty, fully done list", () => {
  expect(ids(ctx({ todos: [todo] }))).toEqual(["all-done"]);
  expect(ids(ctx({ todos: [] }))).toEqual([]);
});

test("already earned badges are not unlocked again", () => {
  expect(ids(ctx({ todos: [todo], hour: 8 }), ["all-done"])).toEqual(["early-bird"]);
});

test("every badge has a label", () => {
  expect(BADGES).toHaveLength(6);
});

test("badges persist and tolerate bad storage", () => {
  expect(loadBadges()).toEqual([]);
  saveBadges(["first-task"]);
  expect(loadBadges()).toEqual(["first-task"]);
  localStorage.setItem("badges", "{oops");
  expect(loadBadges()).toEqual([]);
});
