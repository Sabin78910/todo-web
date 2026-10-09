import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

beforeEach(() => localStorage.clear());

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
  expect(screen.getByText("0/5 today")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("checkbox"));
  expect(screen.getByText("1/5 today")).toBeInTheDocument();
  expect(screen.getByText("15 pts · Beginner")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("checkbox"));
  await userEvent.click(screen.getByRole("checkbox"));
  expect(screen.getByText("15 pts · Beginner")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("rewards")!).points).toBe(15);
});

test("daily goal is editable", async () => {
  render(<App />);
  const input = screen.getByLabelText("Daily goal");
  await userEvent.clear(input);
  await userEvent.type(input, "3");
  expect(screen.getByText("0/3 today")).toBeInTheDocument();
});
