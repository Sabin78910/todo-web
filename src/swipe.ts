export type SwipeAction = "complete" | "delete" | null;

/** Distance a card must travel before releasing completes (right) or deletes (left) it. */
export const swipeThreshold = (width: number): number => Math.max(64, Math.min(120, width * 0.3));

export const swipeAction = (dx: number, width: number): SwipeAction => {
  const th = swipeThreshold(width);
  return dx >= th ? "complete" : dx <= -th ? "delete" : null;
};

/** A gesture is a horizontal swipe once it has moved 10px and mostly sideways; otherwise it's a scroll. */
export const swipeIntent = (dx: number, dy: number): "swipe" | "scroll" | null =>
  Math.hypot(dx, dy) < 10 ? null : Math.abs(dx) > Math.abs(dy) * 1.5 ? "swipe" : "scroll";

/** Rubber-band resistance past the threshold so the card never flies off under the finger. */
export const dampen = (dx: number, width: number): number => {
  const th = swipeThreshold(width);
  const over = Math.abs(dx) - th;
  return over <= 0 ? dx : Math.sign(dx) * (th + over * 0.35);
};
