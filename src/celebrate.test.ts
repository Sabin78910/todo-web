import { loadCelebrated, markCelebrated, prefersReducedMotion, shouldCelebrate } from "./celebrate";

beforeEach(() => localStorage.clear());

test("fires once per day", () => {
  expect(shouldCelebrate(null, "2026-01-02", false)).toBe(true);
  expect(shouldCelebrate("2026-01-01", "2026-01-02", false)).toBe(true);
  expect(shouldCelebrate("2026-01-02", "2026-01-02", false)).toBe(false);
});

test("skipped with reduced motion", () => {
  expect(shouldCelebrate(null, "2026-01-02", true)).toBe(false);
});

test("celebrated day persists", () => {
  expect(loadCelebrated()).toBeNull();
  markCelebrated("2026-01-02");
  expect(loadCelebrated()).toBe("2026-01-02");
});

test("prefersReducedMotion reads the media query and tolerates its absence", () => {
  expect(prefersReducedMotion()).toBe(false);
  window.matchMedia = ((q: string) => ({ matches: q.includes("reduce") })) as unknown as typeof window.matchMedia;
  expect(prefersReducedMotion()).toBe(true);
  // @ts-expect-error cleanup
  delete window.matchMedia;
});
