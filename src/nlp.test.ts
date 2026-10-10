import { hasTokens, parseQuickAdd } from "./nlp";

const today = "2026-10-10"; // a Saturday

test("parses the headline example: date, time, priority and label", () => {
  expect(parseQuickAdd("buy milk tomorrow 5pm !high #home", today)).toEqual({
    text: "buy milk", due: "2026-10-11", time: "17:00", priority: 1, labels: ["home"],
  });
});

test("plain text passes through untouched", () => {
  const q = parseQuickAdd("Write tests", today);
  expect(q).toEqual({ text: "Write tests", labels: [] });
  expect(hasTokens(q)).toBe(false);
  expect(parseQuickAdd("buy 2 apples", today).text).toBe("buy 2 apples");
});

test.each([
  ["!high", 1], ["!h", 1], ["!!!", 1], ["p1", 1], ["!urgent", 1],
  ["!medium", 2], ["!med", 2], ["!!", 2], ["P2", 2],
  ["!low", 3], ["!l", 3], ["p3", 3],
])("priority token %s", (tok, p) => {
  expect(parseQuickAdd(`call bob ${tok}`, today)).toMatchObject({ text: "call bob", priority: p });
  expect(parseQuickAdd(`${tok} call bob`, today)).toMatchObject({ text: "call bob", priority: p });
});

test("does not treat words containing tokens as tokens", () => {
  expect(parseQuickAdd("wow!! nice", today).priority).toBeUndefined();
  expect(parseQuickAdd("update p10 report", today).priority).toBeUndefined();
  expect(parseQuickAdd("todays plan", today).due).toBeUndefined();
  expect(parseQuickAdd("mondays are long", today).due).toBeUndefined();
});

test.each([
  ["pay rent today", "2026-10-10"],
  ["pay rent tomorrow", "2026-10-11"],
  ["pay rent tmr", "2026-10-11"],
  ["pay rent on monday", "2026-10-12"],
  ["pay rent Saturday", "2026-10-17"], // weekdays mean the next one, never today
  ["pay rent next fri", "2026-10-16"],
  ["pay rent in 3 days", "2026-10-13"],
  ["pay rent in 2 weeks", "2026-10-24"],
  ["pay rent in a week", "2026-10-17"],
  ["pay rent next week", "2026-10-17"],
  ["pay rent 2026-12-01", "2026-12-01"],
  ["pay rent jan 5", "2027-01-05"], // past month/day rolls to next year
  ["pay rent 31st december", "2026-12-31"],
  ["pay rent by Oct 20th", "2026-10-20"],
])("date: %s", (input, due) => {
  expect(parseQuickAdd(input, today)).toMatchObject({ text: "pay rent", due });
});

test("invalid calendar dates are left in the title", () => {
  expect(parseQuickAdd("pay rent feb 30", today)).toEqual({ text: "pay rent feb 30", labels: [] });
});

test.each([
  ["call 5pm", "17:00"], ["call at 9am", "09:00"], ["call 12am", "00:00"], ["call 12pm", "12:00"],
  ["call 7:45 pm", "19:45"], ["call at 17:30", "17:30"], ["call @ 8:05", "08:05"], ["call noon", "12:00"],
])("time: %s", (input, time) => {
  // a time without a date means today
  expect(parseQuickAdd(input, today)).toEqual({ text: "call", due: today, time, labels: [] });
});

test("tonight means today at 20:00 unless a time is given", () => {
  expect(parseQuickAdd("movie tonight", today)).toMatchObject({ text: "movie", due: today, time: "20:00" });
  expect(parseQuickAdd("movie tonight 9pm", today)).toMatchObject({ due: today, time: "21:00" });
});

test("rejects impossible times", () => {
  expect(parseQuickAdd("room 13pm", today).time).toBeUndefined();
  expect(parseQuickAdd("score 25:00", today).time).toBeUndefined();
});

test("repeats: daily, weekly and every <weekday>", () => {
  expect(parseQuickAdd("water plants every day", today)).toMatchObject({ text: "water plants", repeat: "daily" });
  expect(parseQuickAdd("stretch daily 7am", today)).toMatchObject({ text: "stretch", repeat: "daily", time: "07:00", due: today });
  expect(parseQuickAdd("review weekly", today)).toMatchObject({ text: "review", repeat: "weekly" });
  expect(parseQuickAdd("bins every week", today)).toMatchObject({ text: "bins", repeat: "weekly" });
  expect(parseQuickAdd("gym every monday", today)).toMatchObject({ text: "gym", repeat: "weekly", due: "2026-10-12" });
  expect(parseQuickAdd("chess every sat", today)).toMatchObject({ text: "chess", repeat: "weekly", due: today });
});

test("dates: false leaves date words alone but still reads time, priority and labels", () => {
  expect(parseQuickAdd("pay rent tomorrow", today, { dates: false })).toEqual({ text: "pay rent tomorrow", labels: [] });
  expect(parseQuickAdd("pay rent tomorrow 5pm !2 #home", today, { dates: false })).toEqual({
    text: "pay rent tomorrow", time: "17:00", priority: 2, labels: ["home"],
  });
});

test("only tokens: keeps the words as the title instead of losing them", () => {
  expect(parseQuickAdd("tomorrow", today)).toEqual({ text: "tomorrow", labels: [] });
  expect(parseQuickAdd("#home", today)).toEqual({ text: "", labels: ["home"] });
});

test("hasTokens reports anything parsed", () => {
  expect(hasTokens(parseQuickAdd("x #a", today))).toBe(true);
  expect(hasTokens(parseQuickAdd("x 5pm", today))).toBe(true);
});
