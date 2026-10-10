export interface Todo {
  id: string;
  text: string;
  done: boolean;
  due?: string; // YYYY-MM-DD
  priority?: Priority;
  repeat?: Repeat;
}
export type Repeat = "daily" | "weekly";
export type Priority = 1 | 2 | 3; // 1 = highest
export type Filter = "all" | "active" | "done" | "today";

export const addTodo = (list: Todo[], text: string, id: string = crypto.randomUUID(), due?: string, priority?: Priority, repeat?: Repeat): Todo[] =>
  text.trim() ? [...list, { id, text: text.trim(), done: false, ...(due ? { due } : {}), ...(priority ? { priority } : {}), ...(repeat ? { repeat } : {}) }] : list;

export const isOverdue = (t: Todo, today: string): boolean => !t.done && !!t.due && t.due < today;

export const isDueTodayOrOverdue = (t: Todo, today: string): boolean => !t.done && !!t.due && t.due <= today;

export const nextDue = (due: string, repeat: Repeat): string => {
  const d = new Date(`${due}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + (repeat === "weekly" ? 7 : 1));
  return d.toISOString().slice(0, 10);
};

/** Toggles a todo; completing a recurring one appends the next occurrence (due from its due date, else today). */
export const toggleTodo = (list: Todo[], id: string, today?: string, newId: string = crypto.randomUUID()): Todo[] => {
  const t = list.find((x) => x.id === id);
  const toggled = list.map((x) => (x.id === id ? { ...x, done: !x.done } : x));
  if (!t || t.done || !t.repeat || !today) return toggled;
  return [...toggled, { ...t, id: newId, done: false, due: nextDue(t.due ?? today, t.repeat) }];
};

export const removeTodo = (list: Todo[], id: string): Todo[] => list.filter((t) => t.id !== id);

export const clearDone = (list: Todo[]): Todo[] => list.filter((t) => !t.done);

export interface Removed {
  todo: Todo;
  index: number;
}

/** Todos matching `pred` with their current indexes, for undoing a removal. */
export const removedWithIndex = (list: Todo[], pred: (t: Todo) => boolean): Removed[] =>
  list.flatMap((todo, index) => (pred(todo) ? [{ todo, index }] : []));

/** Re-inserts removed todos at their original indexes (ascending order keeps positions exact). */
export const restoreTodos = (list: Todo[], removed: Removed[]): Todo[] => {
  const next = [...list];
  [...removed].sort((a, b) => a.index - b.index).forEach(({ todo, index }) => {
    if (!next.some((t) => t.id === todo.id)) next.splice(Math.min(index, next.length), 0, todo);
  });
  return next;
};

export const visible = (list: Todo[], f: Filter, today: string = new Date().toLocaleDateString("en-CA")): Todo[] =>
  f === "all" ? list : list.filter((t) => (f === "today" ? isDueTodayOrOverdue(t, today) : f === "done" ? t.done : !t.done));

export const searchTodos = (list: Todo[], query: string): Todo[] => {
  const q = query.trim().toLowerCase();
  return q ? list.filter((t) => t.text.toLowerCase().includes(q)) : list;
};

const KEY = "todos";
export function load(): Todo[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Todo[]) : [];
  } catch {
    return [];
  }
}

const SEEDED = "seeded";
const SAMPLES = ["Tick me to earn points", "Drag me to reorder", "Set a due date"];
/** Loads todos; on the very first visit returns sample tasks (once, tracked in localStorage). */
export function loadOrSeed(): Todo[] {
  try {
    if (localStorage.getItem(KEY) !== null || localStorage.getItem(SEEDED)) return load();
    localStorage.setItem(SEEDED, "1");
  } catch {
    return [];
  }
  return SAMPLES.map((text, i) => ({ id: `sample-${i + 1}`, text, done: false }));
}
export function save(list: Todo[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable (private mode) — ignore */
  }
}

export const editTodo = (list: Todo[], id: string, text: string): Todo[] =>
  text.trim() ? list.map((t) => (t.id === id ? { ...t, text: text.trim() } : t)) : list;

export const moveTodo = (list: Todo[], id: string, dir: "up" | "down"): Todo[] => {
  const i = list.findIndex((t) => t.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

export const setPriority = (list: Todo[], id: string, priority?: Priority): Todo[] =>
  list.map((t) => (t.id === id ? { ...t, priority } : t));

const rank = (p?: Priority) => p ?? 4;
export const sortByPriority = (list: Todo[]): Todo[] =>
  [...list].sort((a, b) => rank(a.priority) - rank(b.priority) || (a.due ?? "9999").localeCompare(b.due ?? "9999"));

export const dueStatus = (t: Todo, today: string): "overdue" | "today" | "later" | undefined =>
  !t.due ? undefined : isOverdue(t, today) ? "overdue" : !t.done && t.due === today ? "today" : "later";

/** Serializes todos to a JSON backup string. */
export const serialize = (list: Todo[]): string => JSON.stringify({ version: 1, todos: list }, null, 2);

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const bad = (): never => {
  throw new Error("invalid backup");
};

/** Strictly parses a JSON backup; throws on malformed input and drops unknown fields. */
export const parse = (json: string): Todo[] => {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return bad();
  }
  const list = (data as { todos?: unknown } | null)?.todos;
  if (!Array.isArray(list)) return bad();
  const ids = new Set<string>();
  return list.map((raw: Record<string, unknown> | null) => {
    if (typeof raw !== "object" || raw === null) return bad();
    const { id, text, done, due, priority, repeat } = raw;
    if (typeof id !== "string" || !id || ids.has(id)) return bad();
    if (typeof text !== "string" || !text.trim() || typeof done !== "boolean") return bad();
    if (due !== undefined && (typeof due !== "string" || !DAY.test(due))) return bad();
    if (priority !== undefined && priority !== 1 && priority !== 2 && priority !== 3) return bad();
    if (repeat !== undefined && repeat !== "daily" && repeat !== "weekly") return bad();
    ids.add(id);
    return { id, text, done, ...(due ? { due } : {}), ...(priority ? { priority } : {}), ...(repeat ? { repeat } : {}) } as Todo;
  });
};

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/** Strips a trailing `today`/`tomorrow`/weekday (optionally after `on`) and returns it as a due date; weekdays mean the next occurrence. */
export const parseQuickDate = (text: string, today: string): { text: string; due?: string } => {
  const m = /^(.*?\S)(?:\s+on)?\s+(today|tomorrow|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\s*$/i.exec(text);
  if (!m || m[1].toLowerCase() === "on") return { text };
  const word = m[2].toLowerCase();
  const d = new Date(`${today}T00:00:00Z`);
  if (word === "tomorrow") d.setUTCDate(d.getUTCDate() + 1);
  else if (word !== "today") d.setUTCDate(d.getUTCDate() + (((WEEKDAYS.indexOf(word) - d.getUTCDay() + 6) % 7) + 1));
  return { text: m[1], due: d.toISOString().slice(0, 10) };
};
