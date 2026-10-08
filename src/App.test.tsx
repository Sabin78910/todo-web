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
