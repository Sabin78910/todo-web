// Completion feedback: a short synthesized chime (Web Audio, no files to download) and a light haptic tap.
export type Chime = "complete" | "goal" | "focus";

const NOTES: Record<Chime, number[]> = {
  complete: [659.25, 987.77], // E5 -> B5: a quick, bright "pop-ding"
  goal: [523.25, 659.25, 783.99, 1046.5], // C major arpeggio
  focus: [587.33, 880], // soft D5 -> A5 bell
};

type AudioCtor = typeof AudioContext;
let ctx: AudioContext | null = null;

const audioCtor = (): AudioCtor | undefined =>
  (globalThis as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor }).AudioContext ??
  (globalThis as { webkitAudioContext?: AudioCtor }).webkitAudioContext;

/** Plays a chime; returns false when audio isn't available (e.g. tests, old browsers). */
export function chime(kind: Chime): boolean {
  const Ctor = audioCtor();
  if (!Ctor) return false;
  try {
    ctx ??= new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    const start = ctx.currentTime + 0.01;
    const step = kind === "goal" ? 0.09 : 0.07;
    NOTES[kind].forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      const t = start + i * step;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(kind === "goal" ? 0.12 : 0.09, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + (kind === "complete" ? 0.22 : 0.45));
      osc.connect(gain).connect(ctx!.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    });
    return true;
  } catch {
    return false;
  }
}

/** A light vibration on devices that support it; silently ignored elsewhere. */
export function haptic(pattern: number | number[] = 12): boolean {
  const nav = globalThis.navigator as Navigator | undefined;
  if (typeof nav?.vibrate !== "function") return false;
  try {
    return nav.vibrate(pattern);
  } catch {
    return false;
  }
}

const KEY = "sound";
/** Sound and haptics are on unless the user turned them off. */
export function loadSound(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}
export function saveSound(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* storage unavailable — ignore */
  }
}
