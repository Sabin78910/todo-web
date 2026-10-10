import { dampen, swipeAction, swipeIntent, swipeThreshold } from "./swipe";

test("threshold is 30% of the card, clamped to 64..120px", () => {
  expect(swipeThreshold(100)).toBe(64);
  expect(swipeThreshold(300)).toBe(90);
  expect(swipeThreshold(1000)).toBe(120);
});

test("right completes, left deletes, short drags do nothing", () => {
  expect(swipeAction(95, 300)).toBe("complete");
  expect(swipeAction(-95, 300)).toBe("delete");
  expect(swipeAction(80, 300)).toBeNull();
  expect(swipeAction(-80, 300)).toBeNull();
});

test("intent waits for 10px, then picks swipe only for mostly-horizontal moves", () => {
  expect(swipeIntent(5, 5)).toBeNull();
  expect(swipeIntent(20, 5)).toBe("swipe");
  expect(swipeIntent(-20, 5)).toBe("swipe");
  expect(swipeIntent(12, 12)).toBe("scroll");
  expect(swipeIntent(2, 30)).toBe("scroll");
});

test("dampen leaves short drags alone and slows long ones", () => {
  expect(dampen(50, 300)).toBe(50);
  expect(dampen(190, 300)).toBe(90 + 100 * 0.35);
  expect(dampen(-190, 300)).toBe(-(90 + 100 * 0.35));
});
