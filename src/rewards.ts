import type { Todo } from "./todos";

export interface Rewards {
  points: number;
  goal: number;
  day: string; // YYYY-MM-DD that doneToday refers to
  doneToday: number;
  awarded: string[]; // todo ids already rewarded (prevents re-farming)
  metDays: string[]; // YYYY-MM-DD days the goal was reached
  best: number; // best streak ever
  focus?: number; // completed focus sessions, all time
}

export const DEFAULT_GOAL = 5;
const BASE = 10;
const ON_TIME_BONUS = 5;
export const FOCUS_XP = 20;

const LEVELS = [
  { name: "Beginner", min: 0 },
  { name: "Apprentice", min: 100 },
  { name: "Intermediate", min: 300 },
  { name: "Advanced", min: 600 },
  { name: "Expert", min: 1000 },
  { name: "Master", min: 1500 },
  { name: "Grand Master", min: 2500 },
];

export const pointsFor = (t: Todo, today: string): number =>
  BASE + (!t.due || t.due >= today ? ON_TIME_BONUS : 0);

export function levelFor(points: number): { name: string; next: number | null } {
  let i = 0;
  while (i + 1 < LEVELS.length && points >= LEVELS[i + 1].min) i++;
  return { name: LEVELS[i].name, next: LEVELS[i + 1]?.min ?? null };
}

/** Current level (with its 1-based number), the points needed for the next one and progress towards it. */
export function levelProgress(points: number): { name: string; level: number; next: number | null; ratio: number } {
  const { name, next } = levelFor(points);
  const i = LEVELS.findIndex((l) => l.name === name);
  if (next === null) return { name, level: i + 1, next, ratio: 1 };
  return { name, level: i + 1, next, ratio: (points - LEVELS[i].min) / (next - LEVELS[i].min) };
}

/** A finished focus session earns FOCUS_XP; sessions are time-gated, so there is nothing to farm. */
export const awardFocus = (r: Rewards): Rewards => ({ ...r, points: r.points + FOCUS_XP, focus: (r.focus ?? 0) + 1 });

export function award(r: Rewards, t: Todo, today: string): Rewards {
  if (r.awarded.includes(t.id)) return r;
  const doneToday = (r.day === today ? r.doneToday : 0) + 1;
  const next = { ...r, points: r.points + pointsFor(t, today), day: today, doneToday, awarded: [...r.awarded, t.id] };
  if (doneToday < r.goal) return next;
  const metDays = r.metDays.includes(today) ? r.metDays : [...r.metDays, today];
  return { ...next, metDays, best: Math.max(r.best, streakInfo({ ...next, metDays }, today).current) };
}

// Calendar arithmetic on YYYY-MM-DD strings via UTC, so DST/timezone never shifts a day.
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// Today still in progress never breaks the streak; a missed past day resets it to 0.
export function streakInfo(r: Rewards, today: string): { current: number; best: number } {
  const met = new Set(r.metDays);
  if (r.day === today && r.doneToday >= r.goal) met.add(today);
  let day = met.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (met.has(day)) {
    current++;
    day = addDays(day, -1);
  }
  return { current, best: Math.max(r.best, current) };
}

export function goalProgress(r: Rewards, today: string) {
  const done = r.day === today ? r.doneToday : 0;
  return { done, goal: r.goal, ratio: Math.min(1, done / r.goal), reached: done >= r.goal };
}

export const setGoal = (r: Rewards, goal: number): Rewards => {
  const g = Math.floor(goal);
  return Number.isFinite(g) && g >= 1 ? { ...r, goal: g } : r;
};

const KEY = "rewards";
export function loadRewards(today: string): Rewards {
  const empty: Rewards = { points: 0, goal: DEFAULT_GOAL, day: today, doneToday: 0, awarded: [], metDays: [], best: 0 };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty, ...(JSON.parse(raw) as Partial<Rewards>) } : empty;
  } catch {
    return empty;
  }
}
export function saveRewards(r: Rewards): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(r));
  } catch {
    /* storage unavailable — ignore */
  }
}
