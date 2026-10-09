import { award, DEFAULT_GOAL, goalProgress, levelFor, loadRewards, pointsFor, saveRewards, setGoal, type Rewards } from "./rewards";

const todo = { id: "1", text: "a", done: true };
const fresh: Rewards = { points: 0, goal: DEFAULT_GOAL, day: "2026-01-02", doneToday: 0, awarded: [] };

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
