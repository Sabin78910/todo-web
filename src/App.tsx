import { useEffect, useRef, useState } from "react";
import { loadCelebrated, markCelebrated, prefersReducedMotion, shouldCelebrate } from "./celebrate";
import { BADGES, loadBadges, newlyUnlocked, saveBadges } from "./badges";
import { award, goalProgress, levelProgress, loadRewards, saveRewards, setGoal, streakInfo } from "./rewards";
import { useInstallPrompt } from "./install";
import { addTodo, clearDone, dueStatus, editTodo, type Filter, isOverdue, loadOrSeed, moveTodo, type Priority, type Repeat, removeTodo, save, setPriority, sortByPriority, toggleTodo, visible } from "./todos";

const parsePriority = (v: string): Priority | undefined => (v ? (Number(v) as Priority) : undefined);
const PRIORITY_LABEL = { 1: "Priority 1 (high)", 2: "Priority 2 (medium)", 3: "Priority 3 (low)" } as const;

type Theme = "light" | "dark";
const systemTheme = (): Theme => (typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
const loadTheme = (): Theme => {
  const saved = localStorage.getItem("theme");
  return saved === "light" || saved === "dark" ? saved : systemTheme();
};

export default function App() {
  const [theme, setTheme] = useState<Theme>(loadTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    setTheme(next);
  };
  const { canInstall, install } = useInstallPrompt();
  const inputRef = useRef<HTMLInputElement>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [todos, setTodos] = useState(loadOrSeed);
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPrio] = useState("");
  const [repeat, setRepeat] = useState<Repeat | "">("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);

  const today = new Date().toLocaleDateString("en-CA");
  const [rewards, setRewards] = useState(() => loadRewards(today));
  useEffect(() => saveRewards(rewards), [rewards]);

  const [confetti, setConfetti] = useState(false);
  useEffect(() => {
    if (!confetti) return;
    const id = setTimeout(() => setConfetti(false), 3000);
    return () => clearTimeout(id);
  }, [confetti]);

  const [badges, setBadges] = useState(loadBadges);
  useEffect(() => saveBadges(badges), [badges]);
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const toggle = (id: string) => {
    const t = todos.find((x) => x.id === id);
    if (t && !t.done) {
      const next = award(rewards, t, today);
      setRewards(next);
      const unlocked = newlyUnlocked(badges, { rewards: next, todos: toggleTodo(todos, id, today), today, hour: new Date().getHours() });
      if (unlocked.length) {
        setBadges([...badges, ...unlocked]);
        setToast(`Badge unlocked: ${unlocked.map((u) => BADGES.find((b) => b.id === u)!.label).join(", ")}`);
      }
      if (!goalProgress(rewards, today).reached && goalProgress(next, today).reached && shouldCelebrate(loadCelebrated(), today, prefersReducedMotion())) {
        markCelebrated(today);
        setConfetti(true);
      }
    }
    setTodos((l) => toggleTodo(l, id, today));
  };

  const finishEdit = (commit: boolean) => {
    if (commit && editing) setTodos((l) => editTodo(l, editing.id, editing.text));
    setEditing(null);
  };

  useEffect(() => save(todos), [todos]);

  const shown = visible(todos, filter);
  const progress = goalProgress(rewards, today);
  const streak = streakInfo(rewards, today);
  const level = levelProgress(rewards.points);
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const left = todos.filter((t) => !t.done).length;

  return (
    <main>
      {confetti && (
        <div className="confetti" data-testid="confetti" aria-hidden="true">
          {Array.from({ length: 30 }, (_, i) => (
            <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 6) * 0.1}s`, background: `hsl(${(i * 47) % 360} 80% 55%)` }} />
          ))}
        </div>
      )}
      <header className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1>Today</h1>
          <span className="muted">{dateLabel}</span>
        </div>
        <div className="row">
          <label style={{ margin: 0 }}>
            Daily goal
            <input type="number" min={1} style={{ width: 70 }} defaultValue={rewards.goal} onChange={(e) => setRewards((r) => setGoal(r, e.target.valueAsNumber))} />
          </label>
          {canInstall && <button type="button" onClick={install}>Install app</button>}
          <button type="button" className="icon" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>{theme === "dark" ? "☀️" : "🌙"}</button>
        </div>
      </header>
      <section className="hero" aria-label="Daily progress">
        <svg className="ring" width="120" height="120" viewBox="0 0 44 44" role="img" aria-label={`Daily goal ${progress.done} of ${progress.goal}`}>
          <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="4" />
          <circle
            className="ring-fg" cx="22" cy="22" r="18" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 18} strokeDashoffset={2 * Math.PI * 18 * (1 - progress.ratio)}
            transform="rotate(-90 22 22)"
          />
        </svg>
        <div className="hero-body">
          <div className="hero-title">{progress.done} of {progress.goal} done{progress.reached && " 🎉"}</div>
          <div className="hero-level">{level.name}</div>
          <div className="bar" role="progressbar" aria-label="Progress to next level" aria-valuemin={0} aria-valuemax={level.next ?? rewards.points} aria-valuenow={rewards.points}>
            <i style={{ width: `${Math.round(level.ratio * 100)}%` }} />
          </div>
          <div className="hero-pts">{level.next === null ? `${rewards.points} pts · max level` : `${rewards.points} / ${level.next} pts`}</div>
          <span className="chip">🔥 {streak.current}-day streak · best {streak.best}</span>
        </div>
      </section>
      <div role="status" className={toast ? "toast" : "sr-only"}>{toast}</div>
      <section className="card shelf" aria-label="Badge shelf">
        {BADGES.map((b) => {
          const earned = badges.includes(b.id);
          return (
            <span key={b.id} className={earned ? "badge earned" : "badge"} data-testid={`badge-${b.id}`} data-earned={earned} title={b.label}>
              <span aria-hidden="true">{earned ? b.icon : "🔒"}</span> {b.label}
            </span>
          );
        })}
      </section>
      <form
        className="card add-bar"
        onSubmit={(e) => {
          e.preventDefault();
          setTodos((l) => addTodo(l, text, undefined, due, parsePriority(priority), repeat || undefined));
          setText("");
          setRepeat("");
          setDue("");
        }}
      >
        <div className="row add-main">
          <input ref={inputRef} aria-label="New todo" value={text} onChange={(e) => setText(e.target.value)} placeholder="What needs doing?" />
          <button type="button" className="secondary" aria-expanded={showDetails} onClick={() => setShowDetails((v) => !v)}>Details</button>
          <button type="submit">Add</button>
        </div>
        {showDetails && (
          <div className="details">
        <input type="date" aria-label="Due date" value={due} onChange={(e) => setDue(e.target.value)} />
        <select aria-label="Priority" value={priority} onChange={(e) => setPrio(e.target.value)}>
          <option value="">No priority</option>
          <option value="1">P1</option>
          <option value="2">P2</option>
          <option value="3">P3</option>
        </select>
        <select aria-label="Repeat" value={repeat} onChange={(e) => setRepeat(e.target.value as Repeat | "")}>
          <option value="">No repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
          </div>
        )}
      </form>

      <div className="toolbar">
        <div className="segmented" role="group" aria-label="Filter">
        {(["all", "active", "done"] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}>{f}</button>
        ))}
        </div>
        <span className="muted">{left} left</span>
        <button onClick={() => setTodos(sortByPriority)}>Sort by priority</button>
        <button className="link" onClick={() => setTodos(clearDone)}>Clear done</button>
      </div>

      {shown.length === 0 && (
        <div className="empty">
          {todos.length === 0 && (
            <svg data-testid="empty-illustration" width="120" height="96" viewBox="0 0 120 96" aria-hidden="true">
              <rect x="22" y="10" width="76" height="76" rx="14" fill="none" stroke="var(--accent)" strokeWidth="4" />
              <path d="M42 48l14 14 24-28" fill="none" stroke="var(--success)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="104" cy="16" r="5" fill="var(--accent-2)" />
              <circle cx="14" cy="76" r="4" fill="var(--streak)" />
            </svg>
          )}
          <p className="muted">{todos.length === 0 ? "No todos yet" : "Nothing here"}</p>
          {todos.length === 0 && <button type="button" onClick={() => inputRef.current?.focus()}>Add your first task</button>}
        </div>
      )}
      <ul className="list card">
        {shown.map((t, i) => (
          <li key={t.id} className={t.done ? "task done" : "task"}>
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
                <input type="checkbox" className="check" checked={t.done} onChange={() => toggle(t.id)} />
                {t.priority && <i className={`prio-dot prio-${t.priority}`} data-testid="prio-dot" aria-hidden="true" />}
                <span
                  className={[isOverdue(t, today) ? "error" : "", t.done ? "checked" : ""].join(" ").trim() || undefined}
                                  onDoubleClick={() => setEditing({ id: t.id, text: t.text })}
                >{t.text}</span>
                {t.priority && (
                  <span className={`prio prio-${t.priority}`} data-priority={t.priority} title={PRIORITY_LABEL[t.priority]}>
                    P{t.priority}<span className="sr-only"> {PRIORITY_LABEL[t.priority]}</span>
                  </span>
                )}
                {t.repeat && <span className="muted" aria-label={`Repeats ${t.repeat}`}>🔁</span>}
                {t.due && <span className={`due-chip due-${dueStatus(t, today)}`}>due {t.due}</span>}
              </label>
            )}
            <select aria-label={`Priority for ${t.text}`} value={t.priority ?? ""} style={{ width: "auto" }} onChange={(e) => setTodos((l) => setPriority(l, t.id, parsePriority(e.target.value)))}>
              <option value="">None</option>
              <option value="1">P1</option>
              <option value="2">P2</option>
              <option value="3">P3</option>
            </select>
            <button className="link" aria-label={`Move ${t.text} up`} disabled={filter !== "all" || i === 0} onClick={() => setTodos((l) => moveTodo(l, t.id, "up"))}>↑</button>
            <button className="link" aria-label={`Move ${t.text} down`} disabled={filter !== "all" || i === shown.length - 1} onClick={() => setTodos((l) => moveTodo(l, t.id, "down"))}>↓</button>
            <button className="link" aria-label={`Delete ${t.text}`} onClick={() => setTodos((l) => removeTodo(l, t.id))}>✕</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
