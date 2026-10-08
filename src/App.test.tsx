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
