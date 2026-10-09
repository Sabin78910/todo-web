export interface Todo {
  id: string;
  text: string;
  done: boolean;
  due?: string; // YYYY-MM-DD
}
export type Filter = "all" | "active" | "done";

export const addTodo = (list: Todo[], text: string, id: string = crypto.randomUUID(), due?: string): Todo[] =>
  text.trim() ? [...list, { id, text: text.trim(), done: false, ...(due ? { due } : {}) }] : list;

export const isOverdue = (t: Todo, today: string): boolean => !t.done && !!t.due && t.due < today;

export const toggleTodo = (list: Todo[], id: string): Todo[] =>
  list.map((t) => (t.id === id ? { ...t, done: !t.done } : t));

export const removeTodo = (list: Todo[], id: string): Todo[] => list.filter((t) => t.id !== id);

export const clearDone = (list: Todo[]): Todo[] => list.filter((t) => !t.done);

export const visible = (list: Todo[], f: Filter): Todo[] =>
  f === "all" ? list : list.filter((t) => (f === "done" ? t.done : !t.done));

const KEY = "todos";
export function load(): Todo[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Todo[]) : [];
  } catch {
    return [];
  }
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
