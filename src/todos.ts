export interface Todo {
  id: string;
  text: string;
  done: boolean;
}
export type Filter = "all" | "active" | "done";

export const addTodo = (list: Todo[], text: string, id: string = crypto.randomUUID()): Todo[] =>
  text.trim() ? [...list, { id, text: text.trim(), done: false }] : list;

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
