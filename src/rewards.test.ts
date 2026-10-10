import { addDays, award, awardFocus, FOCUS_XP, streakInfo, DEFAULT_GOAL, goalProgress, levelFor, levelProgress, loadRewards, pointsFor, saveRewards, setGoal, type Rewards } from "./rewards";

const todo = { id: "1", text: "a", done: true };
const fresh: Rewards = { points: 0, goal: DEFAULT_GOAL, day: "2026-01-02", doneToday: 0, awarded: [], metDays: [], best: 0 };

test("pointsFor gives more for on-time completion", () => {
  expect(pointsFor(todo, "2026-01-02")).toBe(15);
  expect(pointsFor({ ...todo, due: "2026-01-02" }, "2026-01-02")).toBe(15);
  expect(pointsFor({ ...todo, due: "2026-01-01" }, "2026-01-02")).toBe(10);
});

test("levelFor maps points to Beginner..Grand Master", () => {
  expect(levelFor(0).name).toBe("Beginner");
  expect(levelFor(99).name).toBe("Beginner");
  expect(levelFor(100).name).toBe("Apprentice");
  expect(levelFor(1000).name).toBe("Expert");
  expect(levelFor(2500).name).toBe("Grand Master");
  expect(levelFor(99999).name).toBe("Grand Master");
  expect(levelFor(0).next).toBe(100);
  expect(levelFor(99999).next).toBeNull();
});

test("award adds points once per todo and never deducts", () => {
  const a = award(fresh, todo, "2026-01-02");
  expect(a.points).toBe(15);
  expect(a.doneToday).toBe(1);
  expect(award(a, todo, "2026-01-02")).toBe(a);
});

test("daily count resets on a new day but points stay", () => {
  const a = award(fresh, todo, "2026-01-02");
  const b = award(a, { ...todo, id: "2" }, "2026-01-03");
  expect(b.points).toBe(30);
  expect(b.doneToday).toBe(1);
  expect(b.day).toBe("2026-01-03");
});

test("goalProgress is clamped and respects day rollover", () => {
  expect(goalProgress({ ...fresh, goal: 5, doneToday: 2 }, "2026-01-02")).toEqual({ done: 2, goal: 5, ratio: 0.4, reached: false });
  expect(goalProgress({ ...fresh, goal: 2, doneToday: 4 }, "2026-01-02")).toMatchObject({ ratio: 1, reached: true });
  expect(goalProgress({ ...fresh, doneToday: 3 }, "2026-01-05").done).toBe(0);
});

test("setGoal validates input", () => {
  expect(setGoal(fresh, 8).goal).toBe(8);
  expect(setGoal(fresh, 0)).toBe(fresh);
  expect(setGoal(fresh, NaN)).toBe(fresh);
  expect(setGoal(fresh, 2.7).goal).toBe(2);
});

test("rewards persist in localStorage and tolerate bad data", () => {
  localStorage.clear();
  expect(loadRewards("2026-01-02").goal).toBe(DEFAULT_GOAL);
  saveRewards({ ...fresh, points: 42 });
  expect(loadRewards("2026-01-02").points).toBe(42);
  localStorage.setItem("rewards", "{bad");
  expect(loadRewards("2026-01-02").points).toBe(0);
});

test("addDays is calendar-safe across month, year, leap and DST boundaries", () => {
  expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  expect(addDays("2024-03-01", -1)).toBe("2024-02-29");
  expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
  expect(addDays("2026-11-01", 1)).toBe("2026-11-02");
});

test("streak counts consecutive days, ignoring in-progress today", () => {
  const r = { ...fresh, day: "2026-01-05", metDays: ["2026-01-03", "2026-01-04"], best: 2 };
  expect(streakInfo(r, "2026-01-05")).toEqual({ current: 2, best: 2 });
});

test("streak includes today once goal is reached", () => {
  const r = { ...fresh, goal: 1, day: "2026-01-05", doneToday: 1, metDays: ["2026-01-04"], best: 1 };
  expect(streakInfo(r, "2026-01-05")).toEqual({ current: 2, best: 2 });
});

test("a missed day resets the streak but keeps best", () => {
  const r = { ...fresh, day: "2026-01-02", metDays: ["2025-12-30", "2025-12-31"], best: 2 };
  expect(streakInfo(r, "2026-01-03")).toEqual({ current: 0, best: 2 });
  expect(streakInfo({ ...r, metDays: ["2025-12-28", "2026-01-02"] }, "2026-01-03").current).toBe(1);
});

test("award records the day when the goal is met and updates best", () => {
  let r: Rewards = { ...fresh, goal: 2, metDays: ["2026-01-01"], best: 1 };
  r = award(r, todo, "2026-01-02");
  expect(r.metDays).toEqual(["2026-01-01"]);
  r = award(r, { ...todo, id: "2" }, "2026-01-02");
  expect(r.metDays).toEqual(["2026-01-01", "2026-01-02"]);
  expect(r.best).toBe(2);
});

test("levelProgress gives position within the current level", () => {
  expect(levelProgress(0)).toMatchObject({ name: "Beginner", next: 100, ratio: 0 });
  expect(levelProgress(250)).toMatchObject({ name: "Apprentice", next: 300, ratio: 0.75 });
  expect(levelProgress(2500)).toMatchObject({ name: "Grand Master", next: null, ratio: 1 });
});

test("levelProgress numbers levels from 1", () => {
  expect(levelProgress(0)).toMatchObject({ name: "Beginner", level: 1, next: 100, ratio: 0 });
  expect(levelProgress(200)).toMatchObject({ name: "Apprentice", level: 2, ratio: 0.5 });
  expect(levelProgress(99999)).toMatchObject({ name: "Grand Master", level: 7, next: null, ratio: 1 });
});

test("awardFocus adds focus XP and counts sessions without touching the daily goal", () => {
  const r = loadRewards("2026-10-10");
  const once = awardFocus(r);
  expect(once.points).toBe(FOCUS_XP);
  expect(once.focus).toBe(1);
  expect(awardFocus(once)).toMatchObject({ points: 2 * FOCUS_XP, focus: 2, doneToday: 0 });
});
