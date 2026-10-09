import type { Todo } from "./todos";

export interface Rewards {
  points: number;
  goal: number;
  day: string; // YYYY-MM-DD that doneToday refers to
  doneToday: number;
  awarded: string[]; // todo ids already rewarded (prevents re-farming)
}

export const DEFAULT_GOAL = 5;
const BASE = 10;
const ON_TIME_BONUS = 5;

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

export function award(r: Rewards, t: Todo, today: string): Rewards {
  if (r.awarded.includes(t.id)) return r;
  const doneToday = (r.day === today ? r.doneToday : 0) + 1;
  return { ...r, points: r.points + pointsFor(t, today), day: today, doneToday, awarded: [...r.awarded, t.id] };
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
  const empty: Rewards = { points: 0, goal: DEFAULT_GOAL, day: today, doneToday: 0, awarded: [] };
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
