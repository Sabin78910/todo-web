import { addTodo, clearDone, editTodo, removeTodo, toggleTodo, visible } from "./todos";

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
