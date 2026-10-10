export const FOCUS_MS = 25 * 60_000;
export const BREAK_MS = 5 * 60_000;

export type Phase = "focus" | "break";
export type Status = "idle" | "running" | "paused" | "done";
export type Timer = { phase: Phase; status: Status; durationMs: number; elapsedMs: number; startedAt?: number };

export const createTimer = (phase: Phase): Timer => ({ phase, status: "idle", durationMs: phase === "focus" ? FOCUS_MS : BREAK_MS, elapsedMs: 0 });

const elapsed = (t: Timer, now: number): number => t.elapsedMs + (t.status === "running" && t.startedAt !== undefined ? Math.max(0, now - t.startedAt) : 0);

export const remaining = (t: Timer, now: number): number => (t.status === "done" ? 0 : Math.max(0, t.durationMs - elapsed(t, now)));

export const start = (t: Timer, now: number): Timer => (t.status === "idle" || t.status === "paused" ? { ...t, status: "running", startedAt: now } : t);

export const pause = (t: Timer, now: number): Timer => (t.status === "running" ? { ...t, status: "paused", elapsedMs: elapsed(t, now), startedAt: undefined } : t);

export const reset = (t: Timer): Timer => createTimer(t.phase);

export const tick = (t: Timer, now: number): Timer => (t.status === "running" && remaining(t, now) === 0 ? { ...t, status: "done", elapsedMs: t.durationMs, startedAt: undefined } : t);
