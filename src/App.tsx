import { useEffect, useRef, useState } from "react";
import { loadCelebrated, markCelebrated, prefersReducedMotion, shouldCelebrate } from "./celebrate";
import { BADGES, loadBadges, newlyUnlocked, saveBadges } from "./badges";
import { award, goalProgress, levelProgress, loadRewards, saveRewards, setGoal, streakInfo } from "./rewards";
import { createTimer, pause, remaining, reset, start, tick, type Timer } from "./focus";
import { useInstallPrompt } from "./install";
import { formatDate, formatDay, formatNumber, type Key, type Lang, loadLang, saveLang, t as tr } from "./i18n";
import { addSubtask, addTodo, clearDone, dueStatus, editTodo, type Filter, filterByLabel, parseLabels, isOverdue, loadOrSeed, moveTodo, parseQuickDate, type Priority, type Removed, type Repeat, type Todo, parse, removeSubtask, removeTodo, removedWithIndex, restoreTodos, save, searchTodos, serialize, setNote, NOTE_MAX, setPriority, sortByPriority, toggleSubtask, toggleTodo, visible } from "./todos";

const parsePriority = (v: string): Priority | undefined => (v ? (Number(v) as Priority) : undefined);

type Theme = "light" | "dark";
const systemTheme = (): Theme => (typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
const loadTheme = (): Theme => {
  const saved = localStorage.getItem("theme");
  return saved === "light" || saved === "dark" ? saved : systemTheme();
};

const fmtClock = (ms: number, n: (v: number) => string): string => {
  const s = Math.ceil(ms / 1000);
  return `${n(Math.floor(s / 60)).padStart(2, "0")}:${n(s % 60).padStart(2, "0")}`;
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
  const [lang, setLang] = useState<Lang>(loadLang);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const chooseLang = (l: Lang) => {
    saveLang(l);
    setLang(l);
  };
  const t = (key: Key, params?: Record<string, string | number>) => tr(lang, key, params);
  const n = (x: number) => formatNumber(lang, x);
  const { canInstall, install } = useInstallPrompt();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const helpReturn = useRef<HTMLElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const openHelp = () => {
    helpReturn.current = document.activeElement as HTMLElement | null;
    setHelpOpen(true);
  };
  const closeHelp = () => {
    setHelpOpen(false);
    helpReturn.current?.focus();
  };
  useEffect(() => {
    if (helpOpen) closeBtnRef.current?.focus();
  }, [helpOpen]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if ((e.key !== "/" && e.key !== "?") || e.ctrlKey || e.metaKey || e.altKey) return;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      e.preventDefault();
      if (e.key === "?") openHelp();
      else searchRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  const [showDetails, setShowDetails] = useState(false);
  const [todos, setTodos] = useState(loadOrSeed);
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPrio] = useState("");
  const [repeat, setRepeat] = useState<Repeat | "">("");
  const [filter, setFilter] = useState<Filter>("all");
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const [openSubs, setOpenSubs] = useState<string | null>(null);
  const [subText, setSubText] = useState("");
  const [noteEdit, setNoteEdit] = useState<{ id: string; text: string } | null>(null);
  const [focus, setFocus] = useState<{ id: string; timer: Timer } | null>(null);
  const [focusMsg, setFocusMsg] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const focusRunning = focus?.timer.status === "running";
  useEffect(() => {
    if (!focusRunning) return;
    const id = setInterval(() => {
      const at = Date.now();
      setNow(at);
      setFocus((f) => {
        if (!f) return f;
        const next = tick(f.timer, at);
        if (next !== f.timer) setFocusMsg(t(f.timer.phase === "focus" ? "focus.done" : "focus.breakDone"));
        return next === f.timer ? f : { ...f, timer: next };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [focusRunning]); // eslint-disable-line react-hooks/exhaustive-deps
  const updateTimer = (fn: (tm: Timer, at: number) => Timer, msg?: Key) => {
    const at = Date.now();
    setNow(at);
    setFocus((f) => (f ? { ...f, timer: fn(f.timer, at) } : f));
    if (msg) setFocusMsg(t(msg));
  };
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

  const [undo, setUndo] = useState<{ message: string; removed: Removed[] } | null>(null);
  useEffect(() => {
    if (!undo) return;
    const id = setTimeout(() => setUndo(null), 6000);
    return () => clearTimeout(id);
  }, [undo]);
  const remove = (pred: (x: Todo) => boolean, message: string, apply: (l: Todo[]) => Todo[]) => {
    const removed = removedWithIndex(todos, pred);
    if (!removed.length) return;
    setTodos(apply);
    setUndo({ message, removed });
  };
  const doUndo = () => {
    if (undo) setTodos((l) => restoreTodos(l, undo.removed));
    setUndo(null);
  };

  const [importError, setImportError] = useState(false);
  const exportTodos = () => {
    const url = URL.createObjectURL(new Blob([serialize(todos)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `todos-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const importTodos = async (file?: File) => {
    if (!file) return;
    try {
      const next = parse(await file.text());
      setImportError(false);
      if (window.confirm(t("import.confirm"))) setTodos(next);
    } catch {
      setImportError(true);
    }
  };

  const toggle = (id: string) => {
    const item = todos.find((x) => x.id === id);
    if (item && !item.done) {
      const next = award(rewards, item, today);
      setRewards(next);
      const unlocked = newlyUnlocked(badges, { rewards: next, todos: toggleTodo(todos, id, today), today, hour: new Date().getHours() });
      if (unlocked.length) {
        setBadges([...badges, ...unlocked]);
        setToast(t("badge.unlocked", { names: unlocked.map((u) => t(`badge.${u}` as Key)).join(", ") }));
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

  const shown = searchTodos(filterByLabel(visible(todos, filter, today), labelFilter), query);
  const progress = goalProgress(rewards, today);
  const streak = streakInfo(rewards, today);
  const level = levelProgress(rewards.points);
  const dateLabel = formatDate(lang, new Date(), { weekday: "long", month: "long", day: "numeric" });
  const left = todos.filter((x) => !x.done).length;

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
          <h1>{t("app.today")}</h1>
          <span className="muted">{dateLabel}</span>
        </div>
        <div className="row">
          <div className="segmented" role="group" aria-label={t("lang.label")}>
            <button type="button" aria-pressed={lang === "en"} onClick={() => chooseLang("en")}>EN</button>
            <button type="button" aria-pressed={lang === "ne"} onClick={() => chooseLang("ne")}>नेपाली</button>
          </div>
          <label style={{ margin: 0 }}>
            {t("goal.label")}
            <input type="number" min={1} style={{ width: 70 }} defaultValue={rewards.goal} onChange={(e) => setRewards((r) => setGoal(r, e.target.valueAsNumber))} />
          </label>
          {canInstall && <button type="button" onClick={install}>{t("install")}</button>}
          <button type="button" className="icon" onClick={openHelp} aria-label={t("help.open")}>?</button>
          <button type="button" className="icon" onClick={toggleTheme} aria-label={t(theme === "dark" ? "theme.toLight" : "theme.toDark")}>{theme === "dark" ? "☀️" : "🌙"}</button>
        </div>
      </header>
      <section className="hero" aria-label={t("progress.section")}>
        <svg className="ring" width="120" height="120" viewBox="0 0 44 44" role="img" aria-label={t("progress.ring", { done: n(progress.done), goal: n(progress.goal) })}>
          <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="4" />
          <circle
            className="ring-fg" cx="22" cy="22" r="18" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 18} strokeDashoffset={2 * Math.PI * 18 * (1 - progress.ratio)}
            transform="rotate(-90 22 22)"
          />
        </svg>
        <div className="hero-body">
          <div className="hero-title">{t("progress.title", { done: n(progress.done), goal: n(progress.goal) })}{progress.reached && " 🎉"}</div>
          <div className="hero-level">{t(`level.${level.name}` as Key)}</div>
          <div className="bar" role="progressbar" aria-label={t("progress.level")} aria-valuemin={0} aria-valuemax={level.next ?? rewards.points} aria-valuenow={rewards.points}>
            <i style={{ width: `${Math.round(level.ratio * 100)}%` }} />
          </div>
          <div className="hero-pts">{level.next === null ? t("progress.max", { points: n(rewards.points) }) : t("progress.pts", { points: n(rewards.points), next: n(level.next) })}</div>
          <span className="chip">🔥 {t("streak", { current: n(streak.current), best: n(streak.best) })}</span>
        </div>
      </section>
      <div role="status" className={toast ? "toast" : "sr-only"}>{toast}</div>
      {undo && (
        <div role="status" className="toast undo-toast">
          {undo.message}
          <button type="button" onClick={doUndo}>{t("undo")}</button>
        </div>
      )}
      <section className="card shelf" aria-label={t("badge.shelf")}>
        {BADGES.map((b) => {
          const earned = badges.includes(b.id);
          const label = t(`badge.${b.id}` as Key);
          return (
            <span key={b.id} className={earned ? "badge earned" : "badge"} data-testid={`badge-${b.id}`} data-earned={earned} title={label}>
              <span aria-hidden="true">{earned ? b.icon : "🔒"}</span> {label}
            </span>
          );
        })}
      </section>
      <form
        className="card add-bar"
        onSubmit={(e) => {
          e.preventDefault();
          const lab = parseLabels(text);
          const quick = due ? { text: lab.text } : parseQuickDate(lab.text, today);
          setTodos((l) => addTodo(l, quick.text, undefined, due || quick.due, parsePriority(priority), repeat || undefined, lab.labels));
          setText("");
          setRepeat("");
          setDue("");
        }}
      >
        <div className="row add-main">
          <input ref={inputRef} aria-label={t("add.label")} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("add.placeholder")} />
          <button type="button" className="secondary" aria-expanded={showDetails} onClick={() => setShowDetails((v) => !v)}>{t("add.details")}</button>
          <button type="submit">{t("add.submit")}</button>
        </div>
        {showDetails && (
          <div className="details">
        <input type="date" aria-label={t("field.due")} value={due} onChange={(e) => setDue(e.target.value)} />
        <select aria-label={t("field.priority")} value={priority} onChange={(e) => setPrio(e.target.value)}>
          <option value="">{t("prio.none")}</option>
          <option value="1">{t("prio.short", { n: n(1) })}</option>
          <option value="2">{t("prio.short", { n: n(2) })}</option>
          <option value="3">{t("prio.short", { n: n(3) })}</option>
        </select>
        <select aria-label={t("field.repeat")} value={repeat} onChange={(e) => setRepeat(e.target.value as Repeat | "")}>
          <option value="">{t("repeat.none")}</option>
          <option value="daily">{t("repeat.daily")}</option>
          <option value="weekly">{t("repeat.weekly")}</option>
        </select>
          </div>
        )}
      </form>

      <input
        ref={searchRef}
        type="search"
        aria-label={t("search.label")}
        placeholder={t("search.label")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") setQuery(""); }}
      />

      <div className="toolbar">
        <div className="segmented" role="group" aria-label={t("filter.group")}>
        {(["all", "active", "done", "today"] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}>{t(`filter.${f}`)}</button>
        ))}
        </div>
        {labelFilter && (
          <button type="button" className="label-chip" onClick={() => setLabelFilter(null)} aria-label={t("label.clear")}>#{labelFilter} ✕</button>
        )}
        <span className="muted">{t("left", { n: n(left) })}</span>
        <button onClick={() => setTodos(sortByPriority)}>{t("sort")}</button>
        <button className="link" onClick={() => remove((x) => x.done, t("undo.cleared", { n: n(todos.filter((x) => x.done).length) }), clearDone)}>{t("clear")}</button>
      </div>

      <div className="row">
        <button type="button" className="link" onClick={exportTodos}>{t("export")}</button>
        <label style={{ margin: 0 }}>
          {t("import.label")}
          <input type="file" accept="application/json,.json" onChange={(e) => { void importTodos(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      </div>
      {importError && <p role="alert" className="error">{t("import.error")}</p>}

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
          <p className="muted">{todos.length === 0 ? t("empty.none") : t("empty.filtered")}</p>
          {todos.length === 0 && <button type="button" onClick={() => inputRef.current?.focus()}>{t("empty.cta")}</button>}
        </div>
      )}
      <ul className="list card">
        {shown.map((todo, i) => (
          <li key={todo.id} className={todo.done ? "task done" : "task"}>
            {editing?.id === todo.id ? (
              <input
                aria-label={t("edit.label")}
                autoFocus
                value={editing.text}
                onChange={(e) => setEditing({ id: todo.id, text: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") finishEdit(true);
                  else if (e.key === "Escape") finishEdit(false);
                }}
                onBlur={() => finishEdit(false)}
              />
            ) : (
              <label className="row" style={{ margin: 0, color: "inherit" }}>
                <input type="checkbox" className="check" checked={todo.done} onChange={() => toggle(todo.id)} />
                {todo.priority && <i className={`prio-dot prio-${todo.priority}`} data-testid="prio-dot" aria-hidden="true" />}
                <span
                  className={[isOverdue(todo, today) ? "error" : "", todo.done ? "checked" : ""].join(" ").trim() || undefined}
                                  onDoubleClick={() => setEditing({ id: todo.id, text: todo.text })}
                >{todo.text}</span>
                {todo.priority && (
                  <span className={`prio prio-${todo.priority}`} data-priority={todo.priority} title={t(`prio.${todo.priority}`)}>
                    {t("prio.short", { n: n(todo.priority) })}<span className="sr-only"> {t(`prio.${todo.priority}`)}</span>
                  </span>
                )}
                {todo.repeat && <span className="muted" aria-label={t("repeat.label", { repeat: t(`repeat.${todo.repeat}`).toLowerCase() })}>🔁</span>}
                {todo.due && <span className={`due-chip due-${dueStatus(todo, today)}`}>{t("due", { date: formatDay(lang, todo.due) })}</span>}
              </label>
            )}
            {todo.labels?.map((l) => (
              <button key={l} type="button" className="label-chip" aria-pressed={labelFilter === l} aria-label={t("label.filter", { label: l })} onClick={() => setLabelFilter(l)}>#{l}</button>
            ))}
            {!!todo.subtasks?.length && (
              <span className="muted" aria-label={t("sub.progressLabel", { done: todo.subtasks.filter((s) => s.done).length, total: todo.subtasks.length })}>
                {t("sub.progress", { done: n(todo.subtasks.filter((s) => s.done).length), total: n(todo.subtasks.length) })}
              </span>
            )}
            {todo.note && <span data-testid="note-indicator" className="muted" role="img" aria-label={t("note.has")}>📝</span>}
            <button className="link" aria-expanded={noteEdit?.id === todo.id} aria-label={t("note.open", { text: todo.text })} onClick={() => setNoteEdit(noteEdit?.id === todo.id ? null : { id: todo.id, text: todo.note ?? "" })}>✎</button>
            <button className="link" aria-expanded={focus?.id === todo.id} aria-label={t("focus.open", { text: todo.text })} onClick={() => { setFocusMsg(""); setFocus(focus?.id === todo.id ? null : { id: todo.id, timer: createTimer("focus") }); }}>⏱</button>
            <button className="link" aria-expanded={openSubs === todo.id} aria-label={t("sub.toggle", { text: todo.text })} onClick={() => { setOpenSubs(openSubs === todo.id ? null : todo.id); setSubText(""); }}>☰</button>
            <select aria-label={t("prio.for", { text: todo.text })} value={todo.priority ?? ""} style={{ width: "auto" }} onChange={(e) => setTodos((l) => setPriority(l, todo.id, parsePriority(e.target.value)))}>
              <option value="">{t("prio.noneShort")}</option>
              <option value="1">{t("prio.short", { n: n(1) })}</option>
              <option value="2">{t("prio.short", { n: n(2) })}</option>
              <option value="3">{t("prio.short", { n: n(3) })}</option>
            </select>
            <button className="link" aria-label={t("move.up", { text: todo.text })} disabled={filter !== "all" || query.trim() !== "" || i === 0} onClick={() => setTodos((l) => moveTodo(l, todo.id, "up"))}>↑</button>
            <button className="link" aria-label={t("move.down", { text: todo.text })} disabled={filter !== "all" || query.trim() !== "" || i === shown.length - 1} onClick={() => setTodos((l) => moveTodo(l, todo.id, "down"))}>↓</button>
            <button className="link" aria-label={t("delete", { text: todo.text })} onClick={() => remove((x) => x.id === todo.id, t("undo.deleted"), (l) => removeTodo(l, todo.id))}>✕</button>
            {todo.note && noteEdit?.id !== todo.id && <p className="muted" style={{ width: "100%", margin: 0, whiteSpace: "pre-wrap" }}>{todo.note}</p>}
            {noteEdit?.id === todo.id && (
              <div style={{ width: "100%" }}>
                <textarea
                  aria-label={t("note.edit", { text: todo.text })}
                  maxLength={NOTE_MAX}
                  value={noteEdit.text}
                  onChange={(e) => setNoteEdit({ id: todo.id, text: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Escape") setNoteEdit(null); }}
                />
                <button type="button" aria-label={t("note.save", { text: todo.text })} onClick={() => { setTodos((l) => setNote(l, todo.id, noteEdit.text)); setNoteEdit(null); }}>{t("note.saveShort")}</button>
              </div>
            )}
            {focus?.id === todo.id && (
              <div className="row" role="group" aria-label={t("focus.panel")} style={{ width: "100%" }}>
                <strong>{todo.text}</strong>
                <span className="muted">{t(focus.timer.phase === "focus" ? "focus.phaseFocus" : "focus.phaseBreak")}</span>
                <span role="timer" aria-live="off">{fmtClock(remaining(focus.timer, now), n)}</span>
                {focus.timer.status === "running"
                  ? <button type="button" onClick={() => updateTimer(pause, "focus.paused")}>{t("focus.pause")}</button>
                  : focus.timer.status !== "done" && <button type="button" onClick={() => updateTimer(start, focus.timer.phase === "focus" ? "focus.started" : "focus.breakStarted")}>{t("focus.start")}</button>}
                {focus.timer.status === "done" && focus.timer.phase === "focus" && (
                  <button type="button" onClick={() => { updateTimer((_, at) => start(createTimer("break"), at), "focus.breakStarted"); }}>{t("focus.startBreak")}</button>
                )}
                <button type="button" onClick={() => { updateTimer((tm) => reset(tm)); setFocusMsg(""); }}>{t("focus.reset")}</button>
                <button type="button" onClick={() => { setFocus(null); setFocusMsg(""); }}>{t("focus.close")}</button>
                <div role="status" aria-label={t("focus.status")} className="sr-only">{focusMsg}</div>
              </div>
            )}
            {openSubs === todo.id && (
              <ul className="subtasks" style={{ width: "100%" }}>
                {(todo.subtasks ?? []).map((s) => (
                  <li key={s.id} className="row">
                    <input type="checkbox" aria-label={s.text} checked={s.done} onChange={() => setTodos((l) => toggleSubtask(l, todo.id, s.id))} />
                    <span className={s.done ? "checked" : undefined}>{s.text}</span>
                    <button className="link" aria-label={t("sub.delete", { text: s.text })} onClick={() => setTodos((l) => removeSubtask(l, todo.id, s.id))}>✕</button>
                  </li>
                ))}
                <li>
                  <input
                    aria-label={t("sub.add", { text: todo.text })}
                    value={subText}
                    onChange={(e) => setSubText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      setTodos((l) => addSubtask(l, todo.id, subText));
                      setSubText("");
                    }}
                  />
                </li>
              </ul>
            )}
          </li>
        ))}
      </ul>
      {helpOpen && (
        <div
          className="modal-backdrop"
          onKeyDown={(e) => {
            if (e.key === "Escape") closeHelp();
            else if (e.key === "Tab") {
              e.preventDefault();
              closeBtnRef.current?.focus();
            }
          }}
        >
          <div className="card modal" role="dialog" aria-modal="true" aria-labelledby="help-title">
            <h2 id="help-title">{t("help.title")}</h2>
            <dl>
              <dt><kbd>/</kbd></dt>
              <dd>{t("help.search")}</dd>
              <dt><kbd>?</kbd></dt>
              <dd>{t("help.help")}</dd>
            </dl>
            <button ref={closeBtnRef} type="button" onClick={closeHelp}>{t("help.close")}</button>
          </div>
        </div>
      )}
    </main>
  );
}
