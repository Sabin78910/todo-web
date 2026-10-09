import { addTodo, clearDone, editTodo, isOverdue, removeTodo, toggleTodo, visible } from "./todos";

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
