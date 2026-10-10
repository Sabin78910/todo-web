import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("seeded", "1");
});

test("first visit shows 3 sample tasks that can be ticked or cleared, only once", async () => {
  localStorage.clear();
  const { unmount } = render(<App />);
  expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  expect(screen.getByText("Drag me to reorder")).toBeInTheDocument();
  await userEvent.click(screen.getAllByRole("checkbox")[0]);
  await userEvent.click(screen.getByRole("button", { name: /clear/i }));
  expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  unmount();
  localStorage.setItem("todos", "[]");
  render(<App />);
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
});

test("adds and completes a todo, persisting it", async () => {
  render(<App />);
  await userEvent.type(screen.getByLabelText("New todo"), "Write tests{enter}");
  expect(screen.getByText("Write tests")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("checkbox"));
  expect(screen.getByText("0 left")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("todos")!)[0].done).toBe(true);
});

test("shows 'No todos yet' when the list is empty", () => {
  render(<App />);
  expect(screen.getByText("No todos yet")).toBeInTheDocument();
});

test("shows 'Nothing here' when todos exist but none match the filter", async () => {
  render(<App />);
  await userEvent.type(screen.getByLabelText("New todo"), "Write tests{enter}");
  expect(screen.queryByText("No todos yet")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "done" }));
  expect(screen.getByText("Nothing here")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "all" }));
  await userEvent.click(screen.getByRole("checkbox"));
  await userEvent.click(screen.getByRole("button", { name: "done" }));
  expect(screen.queryByText("Nothing here")).not.toBeInTheDocument();
  expect(screen.getByText("Write tests")).toBeInTheDocument();
});

test("double-click edits a todo; Enter saves", async () => {
  render(<App />);
  await userEvent.type(screen.getByLabelText("New todo"), "Write tests{enter}");
  await userEvent.dblClick(screen.getByText("Write tests"));
  const input = screen.getByLabelText("Edit todo");
  await userEvent.clear(input);
  await userEvent.type(input, "Ship it{enter}");
  expect(screen.getByText("Ship it")).toBeInTheDocument();
  expect(screen.queryByLabelText("Edit todo")).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("todos")!)[0].text).toBe("Ship it");
});

test("Escape cancels editing", async () => {
  render(<App />);
  await userEvent.type(screen.getByLabelText("New todo"), "Write tests{enter}");
  await userEvent.dblClick(screen.getByText("Write tests"));
  await userEvent.type(screen.getByLabelText("Edit todo"), "xyz{escape}");
  expect(screen.getByText("Write tests")).toBeInTheDocument();
  expect(screen.queryByLabelText("Edit todo")).not.toBeInTheDocument();
});

test("overdue todos are shown in red", async () => {
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: "Details" }));
  await userEvent.type(screen.getByLabelText("New todo"), "Old task");
  await userEvent.type(screen.getByLabelText("Due date"), "2000-01-01");
  await userEvent.click(screen.getByRole("button", { name: "Add" }));
  await userEvent.type(screen.getByLabelText("New todo"), "Later task");
  await userEvent.type(screen.getByLabelText("Due date"), "2999-01-01");
  await userEvent.click(screen.getByRole("button", { name: "Add" }));
  expect(screen.getByText("Old task")).toHaveClass("error");
  expect(screen.getByText("Later task")).not.toHaveClass("error");
  expect(JSON.parse(localStorage.getItem("todos")!)[0].due).toBe("2000-01-01");
});

test("move buttons reorder todos and persist", async () => {
  render(<App />);
  await userEvent.type(screen.getByLabelText("New todo"), "one{enter}");
  await userEvent.type(screen.getByLabelText("New todo"), "two{enter}");
  await userEvent.click(screen.getByRole("button", { name: "Move two up" }));
  expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
    expect.stringContaining("two"),
    expect.stringContaining("one"),
  ]);
  expect(JSON.parse(localStorage.getItem("todos")!).map((t: { text: string }) => t.text)).toEqual(["two", "one"]);
  expect(screen.getByRole("button", { name: "Move two up" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Move one down" })).toBeDisabled();
});

test("completing a todo awards points and advances the daily goal; unchecking keeps points", async () => {
  render(<App />);
  await userEvent.type(screen.getByLabelText("New todo"), "Write tests{enter}");
  expect(screen.getByText("0 of 5 done")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("checkbox"));
  expect(screen.getByText("1 of 5 done")).toBeInTheDocument();
  expect(screen.getByText("15 / 100 pts")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("checkbox"));
  await userEvent.click(screen.getByRole("checkbox"));
  expect(screen.getByText("15 / 100 pts")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("rewards")!).points).toBe(15);
});

test("daily goal is editable", async () => {
  render(<App />);
  const input = screen.getByLabelText("Daily goal");
  await userEvent.clear(input);
  await userEvent.type(input, "3");
  expect(screen.getByText("0 of 3 done")).toBeInTheDocument();
});

test("header shows the streak and best streak", async () => {
  render(<App />);
  expect(screen.getByText("🔥 0-day streak · best 0")).toBeInTheDocument();
  await userEvent.clear(screen.getByLabelText("Daily goal"));
  await userEvent.type(screen.getByLabelText("Daily goal"), "1");
  await userEvent.type(screen.getByLabelText("New todo"), "One{enter}");
  await userEvent.click(screen.getByRole("checkbox"));
  expect(screen.getByText("🔥 1-day streak · best 1")).toBeInTheDocument();
});

async function reachGoalOfOne() {
  render(<App />);
  const input = screen.getByLabelText("Daily goal");
  await userEvent.clear(input);
  await userEvent.type(input, "1");
  await userEvent.type(screen.getByLabelText("New todo"), "a{enter}");
  await userEvent.type(screen.getByLabelText("New todo"), "b{enter}");
}

test("confetti bursts once per day when the goal is reached", async () => {
  await reachGoalOfOne();
  expect(screen.queryByTestId("confetti")).not.toBeInTheDocument();
  const [a, b] = screen.getAllByRole("checkbox");
  await userEvent.click(a);
  expect(screen.getByTestId("confetti")).toBeInTheDocument();
  expect(localStorage.getItem("celebrated")).toBe(new Date().toLocaleDateString("en-CA"));
  await userEvent.click(a); // uncheck
  await userEvent.click(b);
  await userEvent.click(a);
  expect(screen.getByTestId("confetti")).toBeInTheDocument(); // still the first burst, not a new one
});

test("no confetti again on the same day after it has played", async () => {
  localStorage.setItem("celebrated", new Date().toLocaleDateString("en-CA"));
  await reachGoalOfOne();
  await userEvent.click(screen.getAllByRole("checkbox")[0]);
  expect(screen.queryByTestId("confetti")).not.toBeInTheDocument();
});

test("no confetti with prefers-reduced-motion", async () => {
  window.matchMedia = ((q: string) => ({ matches: q.includes("reduce") })) as unknown as typeof window.matchMedia;
  await reachGoalOfOne();
  await userEvent.click(screen.getAllByRole("checkbox")[0]);
  expect(screen.queryByTestId("confetti")).not.toBeInTheDocument();
  // @ts-expect-error cleanup
  delete window.matchMedia;
});

test("sets priority with an accessible label and sorts by priority", async () => {
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: "Details" }));
  await userEvent.type(screen.getByLabelText("New todo"), "low{enter}");
  await userEvent.selectOptions(screen.getByLabelText("Priority"), "1");
  await userEvent.type(screen.getByLabelText("New todo"), "urgent{enter}");
  await userEvent.selectOptions(screen.getByLabelText("Priority for low"), "3");
  expect(screen.getByTitle("Priority 3 (low)")).toHaveAttribute("data-priority", "3");
  await userEvent.click(screen.getByRole("button", { name: "Sort by priority" }));
  const texts = screen.getAllByRole("listitem").map((li) => li.textContent);
  expect(texts[0]).toContain("urgent");
  expect(texts[0]).toContain("Priority 1 (high)");
  expect(JSON.parse(localStorage.getItem("todos")!)[0].priority).toBe(1);
});

test("completing a recurring todo adds the next occurrence", async () => {
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: "Details" }));
  await userEvent.type(screen.getByLabelText("New todo"), "water plants");
  await userEvent.selectOptions(screen.getByLabelText("Repeat"), "daily");
  await userEvent.type(screen.getByLabelText("Due date"), "2026-01-31");
  await userEvent.click(screen.getByRole("button", { name: "Add" }));
  expect(screen.getByLabelText("Repeats daily")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("checkbox"));
  expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  expect(screen.getByText("due 2026-02-01")).toBeInTheDocument();
});

test("Details row shows and hides due date, priority and repeat", async () => {
  render(<App />);
  const btn = screen.getByRole("button", { name: "Details" });
  expect(btn).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByLabelText("Due date")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Repeat")).not.toBeInTheDocument();
  await userEvent.click(btn);
  expect(btn).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByLabelText("Due date")).toBeInTheDocument();
  expect(screen.getByLabelText("Priority")).toBeInTheDocument();
  expect(screen.getByLabelText("Repeat")).toBeInTheDocument();
  await userEvent.click(btn);
  expect(screen.queryByLabelText("Due date")).not.toBeInTheDocument();
});

test("theme toggle switches theme and persists it", async () => {
  const { unmount } = render(<App />);
  await userEvent.click(screen.getByRole("button", { name: /theme/i }));
  const first = document.documentElement.dataset.theme;
  expect(["light", "dark"]).toContain(first);
  expect(localStorage.getItem("theme")).toBe(first);
  unmount();
  render(<App />);
  expect(document.documentElement.dataset.theme).toBe(first);
  await userEvent.click(screen.getByRole("button", { name: /theme/i }));
  expect(document.documentElement.dataset.theme).not.toBe(first);
  expect(localStorage.getItem("theme")).toBe(document.documentElement.dataset.theme);
});

test("saved theme is applied on load", () => {
  localStorage.setItem("theme", "dark");
  render(<App />);
  expect(document.documentElement.dataset.theme).toBe("dark");
});

test("hero card shows Today header, date, level, points bar and streak chip", async () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "Today" })).toBeInTheDocument();
  const date = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  expect(screen.getByText(date)).toBeInTheDocument();
  expect(screen.getByText("Beginner")).toBeInTheDocument();
  expect(screen.getByRole("progressbar", { name: "Progress to next level" })).toHaveAttribute("aria-valuenow", "0");
  await userEvent.type(screen.getByLabelText("New todo"), "a{enter}");
  await userEvent.click(screen.getByRole("checkbox"));
  expect(screen.getByRole("progressbar", { name: "Progress to next level" })).toHaveAttribute("aria-valuenow", "15");
  expect(screen.getByRole("img", { name: "Daily goal 1 of 5" })).toBeInTheDocument();
});

test("empty state shows an illustration and a button that focuses the input", async () => {
  render(<App />);
  expect(screen.getByTestId("empty-illustration")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Add your first task" }));
  expect(screen.getByLabelText("New todo")).toHaveFocus();
});

test("empty illustration is hidden once a task exists", async () => {
  render(<App />);
  await userEvent.type(screen.getByLabelText("New todo"), "A{enter}");
  expect(screen.queryByTestId("empty-illustration")).not.toBeInTheDocument();
});

test("task row is a card with a round check, priority dot and due chips", async () => {
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: "Details" }));
  await userEvent.type(screen.getByLabelText("New todo"), "Old");
  await userEvent.type(screen.getByLabelText("Due date"), "2000-01-01");
  await userEvent.selectOptions(screen.getByLabelText("Priority"), "1");
  await userEvent.click(screen.getByRole("button", { name: "Add" }));
  expect(screen.getByText("due 2000-01-01")).toHaveClass("due-chip", "due-overdue");
  expect(screen.getByRole("checkbox").closest("li")).toHaveClass("task");
  expect(screen.getByTestId("prio-dot")).toHaveClass("prio-1");
  await userEvent.type(screen.getByLabelText("New todo"), "Now");
  await userEvent.type(screen.getByLabelText("Due date"), new Date().toLocaleDateString("en-CA"));
  await userEvent.click(screen.getByRole("button", { name: "Add" }));
  expect(screen.getByText(/^due \d{4}/, { selector: ".due-today" })).toBeInTheDocument();
});

test("completed task row gets the done class", async () => {
  render(<App />);
  await userEvent.type(screen.getByLabelText("New todo"), "A{enter}");
  await userEvent.click(screen.getByRole("checkbox"));
  expect(screen.getByRole("checkbox").closest("li")).toHaveClass("done");
});

test("completing a task unlocks a badge toast and fills the badge shelf", async () => {
  render(<App />);
  expect(screen.getByRole("region", { name: "Badge shelf" })).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText("New todo"), "One{enter}");
  await userEvent.click(screen.getByRole("checkbox"));
  expect(screen.getByRole("status")).toHaveTextContent(/First task/);
  expect(screen.getByTestId("badge-first-task")).toHaveAttribute("data-earned", "true");
  expect(screen.getByTestId("badge-streak-7")).toHaveAttribute("data-earned", "false");
  expect(JSON.parse(localStorage.getItem("badges")!)).toContain("first-task");
});

test("shows an Install app button only after beforeinstallprompt", async () => {
  render(<App />);
  expect(screen.queryByRole("button", { name: "Install app" })).not.toBeInTheDocument();
  const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome: "accepted" }),
  });
  act(() => {
    window.dispatchEvent(event);
  });
  await userEvent.click(screen.getByRole("button", { name: "Install app" }));
  expect(event.prompt).toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "Install app" })).not.toBeInTheDocument();
});

test("language switch translates the UI, persists, and defaults from navigator.language", async () => {
  const { unmount } = render(<App />);
  expect(screen.getByRole("heading", { name: "Today" })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "नेपाली" }));
  expect(screen.getByRole("heading", { name: "आज" })).toBeInTheDocument();
  expect(screen.getByLabelText("नयाँ काम")).toBeInTheDocument();
  expect(screen.getByText("० बाँकी")).toBeInTheDocument();
  expect(localStorage.getItem("lang")).toBe("ne");
  expect(document.documentElement.lang).toBe("ne");
  unmount();
  render(<App />);
  expect(screen.getByRole("heading", { name: "आज" })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "EN" }));
  expect(screen.getByRole("heading", { name: "Today" })).toBeInTheDocument();
  expect(localStorage.getItem("lang")).toBe("en");
});

test("undo restores a deleted todo at its original position", async () => {
  localStorage.setItem("todos", JSON.stringify(["a", "b", "c"].map((x) => ({ id: x, text: x, done: false }))));
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: "Delete b" }));
  expect(screen.queryByText("b")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Undo" }));
  expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  expect(JSON.parse(localStorage.getItem("todos")!).map((t: { id: string }) => t.id)).toEqual(["a", "b", "c"]);
  expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
});

test("undo restores cleared done todos, and the toast auto-dismisses", async () => {
  localStorage.setItem("todos", JSON.stringify([true, false, true].map((done, i) => ({ id: `t${i}`, text: `t${i}`, done }))));
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: /clear done/i }));
  expect(screen.getAllByRole("checkbox")).toHaveLength(1);
  await userEvent.click(screen.getByRole("button", { name: "Undo" }));
  expect(JSON.parse(localStorage.getItem("todos")!).map((t: { id: string }) => t.id)).toEqual(["t0", "t1", "t2"]);

  vi.useFakeTimers({ shouldAdvanceTime: true });
  await userEvent.click(screen.getByRole("button", { name: "Delete t1" }));
  expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
  act(() => { vi.advanceTimersByTime(6100); });
  expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
  vi.useRealTimers();
});

const backup = (todos: unknown) => new File([JSON.stringify({ version: 1, todos })], "b.json", { type: "application/json" });

test("export downloads a dated JSON blob without network", async () => {
  localStorage.setItem("todos", JSON.stringify([{ id: "a", text: "a", done: false }]));
  const create = vi.fn(() => "blob:x");
  const revoke = vi.fn();
  Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: "Export" }));
  expect(create).toHaveBeenCalledWith(expect.any(Blob));
  expect(click).toHaveBeenCalled();
  expect(revoke).toHaveBeenCalled();
  click.mockRestore();
});

test("import replaces todos after confirmation, and keeps them if declined", async () => {
  localStorage.setItem("todos", JSON.stringify([{ id: "old", text: "old", done: false }]));
  const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
  render(<App />);
  const input = screen.getByLabelText("Import backup");
  await userEvent.upload(input, backup([{ id: "n", text: "new", done: false }]));
  expect(await screen.findByText("old")).toBeInTheDocument();
  await userEvent.upload(input, backup([{ id: "n", text: "new", done: false }]));
  expect(await screen.findByText("new")).toBeInTheDocument();
  expect(screen.queryByText("old")).not.toBeInTheDocument();
  expect(confirm).toHaveBeenCalledTimes(2);
  confirm.mockRestore();
});

test("importing an invalid file shows an accessible error and keeps data", async () => {
  localStorage.setItem("todos", JSON.stringify([{ id: "old", text: "old", done: false }]));
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
  render(<App />);
  await userEvent.upload(screen.getByLabelText("Import backup"), new File(["nope"], "b.json", { type: "application/json" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Invalid backup file");
  expect(screen.getByText("old")).toBeInTheDocument();
  expect(confirm).not.toHaveBeenCalled();
  confirm.mockRestore();
});

test("search filters with status filter, / focuses, Esc clears, reorder disabled", async () => {
  localStorage.setItem("todos", JSON.stringify([
    { id: "1", text: "Buy milk", done: false },
    { id: "2", text: "Milk the cow", done: true },
    { id: "3", text: "Walk dog", done: false },
  ]));
  render(<App />);
  const search = screen.getByLabelText("Search todos");
  await userEvent.keyboard("/");
  expect(search).toHaveFocus();
  expect(search).toHaveValue("");
  await userEvent.keyboard("MILK");
  expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  expect(screen.getByRole("button", { name: "Move Milk the cow up" })).toBeDisabled();
  await userEvent.click(screen.getByRole("button", { name: "active" }));
  expect(screen.getAllByRole("checkbox")).toHaveLength(1);
  await userEvent.clear(search);
  await userEvent.type(search, "nope");
  expect(screen.getByText("Nothing here")).toBeInTheDocument();
  await userEvent.keyboard("{Escape}");
  expect(search).toHaveValue("");
  expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  await userEvent.click(screen.getByRole("button", { name: "all" }));
  await userEvent.keyboard("{Escape}");
  const add = screen.getByLabelText("New todo");
  await userEvent.click(add);
  await userEvent.keyboard("/");
  expect(add).toHaveValue("/");
});

test("quick add parses a trailing natural-language due date", async () => {
  render(<App />);
  await userEvent.type(screen.getByLabelText("New todo"), "pay rent tomorrow");
  await userEvent.click(screen.getByRole("button", { name: "Add" }));
  const d = new Date();
  d.setDate(d.getDate() + 1);
  expect(screen.getByText("pay rent")).toBeInTheDocument();
  const saved = JSON.parse(localStorage.getItem("todos")!).find((t: { text: string }) => t.text === "pay rent");
  expect(saved.due).toBe(d.toLocaleDateString("en-CA"));
});

test("manual due date wins over quick-add words", async () => {
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: "Details" }));
  await userEvent.type(screen.getByLabelText("New todo"), "pay rent tomorrow");
  await userEvent.type(screen.getByLabelText("Due date"), "2999-01-01");
  await userEvent.click(screen.getByRole("button", { name: "Add" }));
  const saved = JSON.parse(localStorage.getItem("todos")!).find((t: { text: string }) => t.text === "pay rent tomorrow");
  expect(saved.due).toBe("2999-01-01");
});
