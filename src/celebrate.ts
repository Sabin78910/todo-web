const KEY = "celebrated";

export const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const shouldCelebrate = (last: string | null, today: string, reduced: boolean): boolean =>
  !reduced && last !== today;

export function loadCelebrated(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
export function markCelebrated(day: string): void {
  try {
    localStorage.setItem(KEY, day);
  } catch {
    /* storage unavailable — ignore */
  }
}
