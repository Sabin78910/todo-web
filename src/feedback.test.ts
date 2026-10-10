import { chime, haptic, loadSound, saveSound } from "./feedback";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("sound defaults on and the choice persists", () => {
  localStorage.clear();
  expect(loadSound()).toBe(true);
  saveSound(false);
  expect(loadSound()).toBe(false);
  saveSound(true);
  expect(loadSound()).toBe(true);
});

test("chime is a no-op without Web Audio", () => {
  vi.stubGlobal("AudioContext", undefined);
  expect(chime("complete")).toBe(false);
});

test("chime schedules one short oscillator per note", () => {
  const started: number[] = [];
  const param = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
  class FakeCtx {
    currentTime = 0;
    state = "running";
    destination = {};
    createGain = () => ({ gain: param, connect: (d: unknown) => d });
    createOscillator = () => ({ type: "", frequency: param, connect: (g: unknown) => g, start: (t: number) => started.push(t), stop: vi.fn() });
  }
  vi.stubGlobal("AudioContext", FakeCtx);
  expect(chime("goal")).toBe(true);
  expect(started).toHaveLength(4);
  expect(started[1]).toBeGreaterThan(started[0]);
});

test("haptic vibrates only where supported", () => {
  const vibrate = vi.fn(() => true);
  vi.stubGlobal("navigator", { vibrate });
  expect(haptic(10)).toBe(true);
  expect(vibrate).toHaveBeenCalledWith(10);
  vi.stubGlobal("navigator", {});
  expect(haptic()).toBe(false);
});
