import { useEffect, useState } from "react";
import { award, goalProgress, levelFor, loadRewards, saveRewards, setGoal } from "./rewards";
import { addTodo, clearDone, editTodo, type Filter, isOverdue, load, moveTodo, removeTodo, save, toggleTodo, visible } from "./todos";

export default function App() {
  const [todos, setTodos] = useState(load);
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);

  const today = new Date().toLocaleDateString("en-CA");
  const [rewards, setRewards] = useState(() => loadRewards(today));
  useEffect(() => saveRewards(rewards), [rewards]);

  const toggle = (id: string) => {
    const t = todos.find((x) => x.id === id);
    if (t && !t.done) setRewards((r) => award(r, t, today));
    setTodos((l) => toggleTodo(l, id));
  };

  const finishEdit = (commit: boolean) => {
    if (commit && editing) setTodos((l) => editTodo(l, editing.id, editing.text));
    setEditing(null);
  };

  useEffect(() => save(todos), [todos]);

  const shown = visible(todos, filter);
  const progress = goalProgress(rewards, today);
  const level = levelFor(rewards.points);
  const left = todos.filter((t) => !t.done).length;

  return (
    <main>
      <header className="row" style={{ justifyContent: "space-between" }}>
        <h1>Todo</h1>
        <div className="row">
          <svg width="44" height="44" viewBox="0 0 44 44" role="img" aria-label={`Daily goal ${progress.done} of ${progress.goal}`}>
            <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border)" strokeWidth="5" />
            <circle
              cx="22" cy="22" r="18" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 18} strokeDashoffset={2 * Math.PI * 18 * (1 - progress.ratio)}
              transform="rotate(-90 22 22)"
            />
          </svg>
          <span>
            <span>{progress.done}/{progress.goal} today</span>{progress.reached && " 🎉"}
            <br />
            <span className="muted">{rewards.points} pts · {level.name}</span>
          </span>
          <label style={{ margin: 0 }}>
            Daily goal
            <input type="number" min={1} style={{ width: 70 }} defaultValue={rewards.goal} onChange={(e) => setRewards((r) => setGoal(r, e.target.valueAsNumber))} />
          </label>
        </div>
      </header>
      <form
        className="row card"
        onSubmit={(e) => {
          e.preventDefault();
          setTodos((l) => addTodo(l, text, undefined, due));
          setText("");
          setDue("");
        }}
      >
        <input aria-label="New todo" value={text} onChange={(e) => setText(e.target.value)} placeholder="What needs doing?" />
        <input type="date" aria-label="Due date" value={due} onChange={(e) => setDue(e.target.value)} style={{ width: "auto" }} />
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
        {shown.map((t, i) => (
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
                <input type="checkbox" style={{ width: "auto" }} checked={t.done} onChange={() => toggle(t.id)} />
                <span
                  className={isOverdue(t, today) ? "error" : undefined}
                  style={{ textDecoration: t.done ? "line-through" : "none" }}
                  onDoubleClick={() => setEditing({ id: t.id, text: t.text })}
                >{t.text}</span>
                {t.due && <span className={isOverdue(t, today) ? "error" : "muted"}>due {t.due}</span>}
              </label>
            )}
            <button className="link" aria-label={`Move ${t.text} up`} disabled={filter !== "all" || i === 0} onClick={() => setTodos((l) => moveTodo(l, t.id, "up"))}>↑</button>
            <button className="link" aria-label={`Move ${t.text} down`} disabled={filter !== "all" || i === shown.length - 1} onClick={() => setTodos((l) => moveTodo(l, t.id, "down"))}>↓</button>
            <button className="link" aria-label={`Delete ${t.text}`} onClick={() => setTodos((l) => removeTodo(l, t.id))}>✕</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
