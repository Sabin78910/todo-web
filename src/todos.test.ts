import { addTodo, loadOrSeed, save, clearDone, editTodo, dueStatus, isDueTodayOrOverdue, isOverdue, moveTodo, nextDue, parse, serialize, removeTodo, removedWithIndex, restoreTodos, setPriority, sortByPriority, toggleTodo, visible, searchTodos, parseQuickDate } from "./todos";
import type { Todo } from "./todos";

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

test("nextDue advances by a day or a week across week, month and year boundaries", () => {
  expect(nextDue("2026-01-05", "daily")).toBe("2026-01-06");
  expect(nextDue("2026-01-31", "daily")).toBe("2026-02-01");
  expect(nextDue("2026-02-28", "daily")).toBe("2026-03-01");
  expect(nextDue("2028-02-28", "daily")).toBe("2028-02-29");
  expect(nextDue("2026-12-31", "daily")).toBe("2027-01-01");
  expect(nextDue("2026-01-05", "weekly")).toBe("2026-01-12");
  expect(nextDue("2026-01-28", "weekly")).toBe("2026-02-04");
  expect(nextDue("2026-12-28", "weekly")).toBe("2027-01-04");
});

test("completing a recurring todo creates the next occurrence", () => {
  const l = addTodo([], "water", "1", "2026-01-31", 2, "daily");
  const r = toggleTodo(l, "1", "2026-01-31", "2");
  expect(r).toHaveLength(2);
  expect(r[0].done).toBe(true);
  expect(r[1]).toEqual({ id: "2", text: "water", done: false, due: "2026-02-01", priority: 2, repeat: "daily" });
  // un-completing or non-recurring todos add nothing
  expect(toggleTodo(r, "1", "2026-01-31", "3")).toHaveLength(2);
  expect(toggleTodo(addTodo([], "a", "1"), "1", "2026-01-31", "2")).toHaveLength(1);
});

test("recurring todo without a due date repeats from today", () => {
  const l = addTodo([], "gym", "1", undefined, undefined, "weekly");
  expect(toggleTodo(l, "1", "2026-01-28", "2")[1].due).toBe("2026-02-04");
});

test("dueStatus classifies overdue, today, later and none", () => {
  const t = (due?: string, done = false) => ({ id: "1", text: "x", done, due });
  expect(dueStatus(t("2000-01-01"), "2026-01-01")).toBe("overdue");
  expect(dueStatus(t("2026-01-01"), "2026-01-01")).toBe("today");
  expect(dueStatus(t("2026-01-02"), "2026-01-01")).toBe("later");
  expect(dueStatus(t(), "2026-01-01")).toBeUndefined();
  expect(dueStatus(t("2000-01-01", true), "2026-01-01")).toBe("later");
});

describe("loadOrSeed", () => {
  beforeEach(() => localStorage.clear());

  test("first visit returns the 3 sample tasks and marks them as shown", () => {
    const l = loadOrSeed();
    expect(l.map((t) => t.text)).toEqual(["Tick me to earn points", "Drag me to reorder", "Set a due date"]);
    expect(l.every((t) => !t.done)).toBe(true);
    expect(localStorage.getItem("seeded")).toBe("1");
  });

  test("shown only once, even after the list is cleared", () => {
    loadOrSeed();
    save([]);
    expect(loadOrSeed()).toEqual([]);
  });

  test("does not seed when todos already exist", () => {
    save(addTodo([], "mine", "1"));
    expect(loadOrSeed().map((t) => t.text)).toEqual(["mine"]);
  });
});

describe("undo helpers", () => {
  const base = ["a", "b", "c", "d"].map((x, i) => ({ id: x, text: x, done: i % 2 === 1 }));
  test("removedWithIndex records original indexes", () => {
    expect(removedWithIndex(base, (t) => t.done).map((r) => [r.todo.id, r.index])).toEqual([["b", 1], ["d", 3]]);
  });
  test("restoreTodos puts removed todos back at original positions", () => {
    const removed = removedWithIndex(base, (t) => t.done);
    expect(restoreTodos(clearDone(base), removed)).toEqual(base);
    expect(restoreTodos(removeTodo(base, "a"), removedWithIndex(base, (t) => t.id === "a"))).toEqual(base);
  });
  test("restoreTodos clamps indexes and skips duplicates", () => {
    const removed = [{ todo: base[3], index: 9 }, { todo: base[0], index: 0 }];
    expect(restoreTodos([base[0]], removed).map((t) => t.id)).toEqual(["a", "d"]);
  });
});

test("serialize/parse round trip keeps todos and drops unknown fields", () => {
  const list = [
    { id: "1", text: "a", done: true, due: "2026-01-02", priority: 2 as const, repeat: "weekly" as const },
    { id: "2", text: "b", done: false },
  ];
  expect(parse(serialize(list))).toEqual(list);
  const withExtra = JSON.stringify({ version: 1, extra: 1, todos: [{ ...list[1], evil: "x" }] });
  expect(parse(withExtra)).toEqual([list[1]]);
});

test("parse rejects malformed input", () => {
  const ok = { id: "1", text: "a", done: false };
  const wrap = (todos: unknown) => JSON.stringify({ version: 1, todos });
  for (const bad of [
    "not json", "null", "[]", "{}", wrap({}), wrap([null]), wrap([{ ...ok, id: "" }]), wrap([{ ...ok, text: " " }]),
    wrap([{ ...ok, done: "no" }]), wrap([{ ...ok, due: "tomorrow" }]), wrap([{ ...ok, priority: 4 }]),
    wrap([{ ...ok, repeat: "monthly" }]), wrap([ok, ok]),
  ]) expect(() => parse(bad), bad).toThrow();
});

test("searchTodos trims, ignores case, and empty query returns all", () => {
  const l = [
    { id: "1", text: "Buy Milk", done: false },
    { id: "2", text: "Walk dog", done: true },
  ];
  expect(searchTodos(l, "  milk ").map((t) => t.id)).toEqual(["1"]);
  expect(searchTodos(l, "WALK").map((t) => t.id)).toEqual(["2"]);
  expect(searchTodos(l, "   ")).toBe(l);
  expect(searchTodos(l, "zzz")).toEqual([]);
});

test("parseQuickDate", () => {
  const today = "2026-10-10"; // Saturday
  expect(parseQuickDate("buy milk today", today)).toEqual({ text: "buy milk", due: "2026-10-10" });
  expect(parseQuickDate("buy milk Tomorrow", today)).toEqual({ text: "buy milk", due: "2026-10-11" });
  expect(parseQuickDate("call Sam on friday", today)).toEqual({ text: "call Sam", due: "2026-10-16" });
  expect(parseQuickDate("call Sam MONDAY", today)).toEqual({ text: "call Sam", due: "2026-10-12" });
  expect(parseQuickDate("gym saturday", today)).toEqual({ text: "gym", due: "2026-10-17" });
  expect(parseQuickDate("rest sunday", today)).toEqual({ text: "rest", due: "2026-10-11" });
  expect(parseQuickDate("buy milk", today)).toEqual({ text: "buy milk" });
  expect(parseQuickDate("tomorrow is another day", today)).toEqual({ text: "tomorrow is another day" });
  expect(parseQuickDate("tomorrow", today)).toEqual({ text: "tomorrow" });
  expect(parseQuickDate("on friday", today)).toEqual({ text: "on friday" });
});

describe("today filter", () => {
  const today = "2026-10-10";
  const l: Todo[] = [
    { id: "1", text: "overdue", done: false, due: "2026-10-09" },
    { id: "2", text: "today", done: false, due: today },
    { id: "3", text: "future", done: false, due: "2026-10-11" },
    { id: "4", text: "nodue", done: false },
    { id: "5", text: "done", done: true, due: today },
  ];
  test("isDueTodayOrOverdue", () => {
    expect(l.map((t) => isDueTodayOrOverdue(t, today))).toEqual([true, true, false, false, false]);
  });
  test("visible today keeps open todos due by today", () => {
    expect(visible(l, "today", today).map((t) => t.id)).toEqual(["1", "2"]);
  });
});
