import { useEffect, useState } from "react";
import { addTodo, clearDone, editTodo, type Filter, load, removeTodo, save, toggleTodo, visible } from "./todos";

export default function App() {
  const [todos, setTodos] = useState(load);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);

  const finishEdit = (commit: boolean) => {
    if (commit && editing) setTodos((l) => editTodo(l, editing.id, editing.text));
    setEditing(null);
  };

  useEffect(() => save(todos), [todos]);

  const shown = visible(todos, filter);
  const left = todos.filter((t) => !t.done).length;

  return (
    <main>
      <h1>Todo</h1>
      <form
        className="row card"
        onSubmit={(e) => {
          e.preventDefault();
          setTodos((l) => addTodo(l, text));
          setText("");
        }}
      >
        <input aria-label="New todo" value={text} onChange={(e) => setText(e.target.value)} placeholder="What needs doing?" />
        <button type="submit">Add</button>
      </form>

      <div className="row" style={{ marginBottom: 12 }}>
        {(["all", "active", "done"] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}>{f}</button>
        ))}
        <span className="muted">{left} left</span>
        <button className="link" onClick={() => setTodos(clearDone)}>Clear done</button>
      </div>

      {shown.length === 0 && <p className="muted">{todos.length === 0 ? "No todos yet" : "Nothing here"}</p>}
      <ul className="list card">
        {shown.map((t) => (
          <li key={t.id}>
            {editing?.id === t.id ? (
              <input
                aria-label="Edit todo"
                autoFocus
                value={editing.text}
                onChange={(e) => setEditing({ id: t.id, text: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") finishEdit(true);
                  else if (e.key === "Escape") finishEdit(false);
                }}
                onBlur={() => finishEdit(false)}
              />
            ) : (
              <label className="row" style={{ margin: 0, color: "inherit" }}>
                <input type="checkbox" style={{ width: "auto" }} checked={t.done} onChange={() => setTodos((l) => toggleTodo(l, t.id))} />
                <span style={{ textDecoration: t.done ? "line-through" : "none" }} onDoubleClick={() => setEditing({ id: t.id, text: t.text })}>{t.text}</span>
              </label>
            )}
            <button className="link" aria-label={`Delete ${t.text}`} onClick={() => setTodos((l) => removeTodo(l, t.id))}>✕</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
