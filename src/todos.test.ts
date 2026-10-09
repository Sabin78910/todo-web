import { addTodo, clearDone, editTodo, isOverdue, moveTodo, removeTodo, setPriority, sortByPriority, toggleTodo, visible } from "./todos";

test("todo lifecycle", () => {
  let l = addTodo([], "  milk ", "1");
  l = addTodo(l, "eggs", "2");
  l = addTodo(l, "   ", "3");
  expect(l.map((t) => t.text)).toEqual(["milk", "eggs"]);
  l = toggleTodo(l, "1");
  expect(visible(l, "done")).toHaveLength(1);
  expect(visible(l, "active")[0].text).toBe("eggs");
  expect(clearDone(l)).toHaveLength(1);
  expect(removeTodo(l, "2")).toHaveLength(1);
});

test("editTodo renames a todo and ignores blank text", () => {
  const l = addTodo([], "milk", "1");
  expect(editTodo(l, "1", "  oat milk ")[0].text).toBe("oat milk");
  expect(editTodo(l, "1", "   ")).toBe(l);
  expect(editTodo(l, "x", "eggs")).toEqual(l);
});

test("addTodo stores an optional due date", () => {
  expect(addTodo([], "a", "1", "2026-01-02")[0].due).toBe("2026-01-02");
  expect(addTodo([], "a", "1")[0].due).toBeUndefined();
  expect(addTodo([], "a", "1", "")[0].due).toBeUndefined();
});

test("isOverdue is true only for undone todos due before today", () => {
  const t = { id: "1", text: "a", done: false, due: "2026-01-01" };
  expect(isOverdue(t, "2026-01-02")).toBe(true);
  expect(isOverdue(t, "2026-01-01")).toBe(false);
  expect(isOverdue({ ...t, done: true }, "2026-01-02")).toBe(false);
  expect(isOverdue({ ...t, due: undefined }, "2026-01-02")).toBe(false);
});

test("moveTodo swaps with neighbour and no-ops at edges or unknown id", () => {
  const l = ["a", "b", "c"].map((x) => addTodo([], x, x)[0]);
  const ids = (x: typeof l) => x.map((t) => t.id).join("");
  expect(ids(moveTodo(l, "b", "up"))).toBe("bac");
  expect(ids(moveTodo(l, "b", "down"))).toBe("acb");
  expect(moveTodo(l, "a", "up")).toBe(l);
  expect(moveTodo(l, "c", "down")).toBe(l);
  expect(moveTodo(l, "x", "up")).toBe(l);
  expect(ids(l)).toBe("abc");
});

test("addTodo stores an optional priority and setPriority changes or clears it", () => {
  expect(addTodo([], "a", "1", undefined, 2)[0].priority).toBe(2);
  expect(addTodo([], "a", "1")[0].priority).toBeUndefined();
  const l = addTodo([], "a", "1");
  expect(setPriority(l, "1", 1)[0].priority).toBe(1);
  expect(setPriority(setPriority(l, "1", 3), "1", undefined)[0].priority).toBeUndefined();
});

test("sortByPriority orders by priority then due date, unset last, stably", () => {
  const mk = (id: string, priority?: 1 | 2 | 3, due?: string) => ({ id, text: id, done: false, priority, due });
  const l = [mk("a"), mk("b", 3, "2026-01-01"), mk("c", 1, "2026-02-01"), mk("d", 1, "2026-01-01"), mk("e", 1), mk("f", 3, "2026-01-01")];
  expect(sortByPriority(l).map((t) => t.id).join("")).toBe("dcebfa");
  expect(l.map((t) => t.id).join("")).toBe("abcdef");
});
