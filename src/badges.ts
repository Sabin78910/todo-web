import { streakInfo, type Rewards } from "./rewards";
import type { Todo } from "./todos";

export interface BadgeContext {
  rewards: Rewards;
  todos: Todo[]; // list after the completion
  today: string;
  hour: number; // local hour (0-23) of the completion
}

export interface Badge {
  id: string;
  label: string;
  icon: string;
  test: (c: BadgeContext) => boolean;
}

export const BADGES: Badge[] = [
  { id: "first-task", label: "First task", icon: "🌱", test: (c) => c.rewards.awarded.length >= 1 },
  { id: "streak-3", label: "3-day streak", icon: "🔥", test: (c) => streakInfo(c.rewards, c.today).best >= 3 },
  { id: "streak-7", label: "7-day streak", icon: "⚡", test: (c) => streakInfo(c.rewards, c.today).best >= 7 },
  { id: "tasks-50", label: "50 tasks done", icon: "🏅", test: (c) => c.rewards.awarded.length >= 50 },
  { id: "early-bird", label: "Early bird", icon: "🐦", test: (c) => c.hour < 9 },
  { id: "all-done", label: "All done today", icon: "🎯", test: (c) => c.todos.length > 0 && c.todos.every((t) => t.done) },
];

/** Ids of badges whose rule is met by this context and which aren't earned yet. */
export const newlyUnlocked = (earned: string[], c: BadgeContext): string[] =>
  BADGES.filter((b) => !earned.includes(b.id) && b.test(c)).map((b) => b.id);

const KEY = "badges";
export function loadBadges(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
export function saveBadges(ids: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable — ignore */
  }
}
