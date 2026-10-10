import { addDays } from "./rewards";
import { parseLabels, type Priority, type Repeat } from "./todos";

/** What quick add understood from free text such as "buy milk tomorrow 5pm !high #home". */
export interface QuickAdd {
  text: string;
  due?: string; // YYYY-MM-DD
  time?: string; // HH:MM, 24-hour
  priority?: Priority;
  repeat?: Repeat;
  labels: string[];
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const SHORT_DAYS: Record<string, number> = { sun: 0, mon: 1, tue: 2, tues: 2, wed: 3, thu: 4, thur: 4, thurs: 4, fri: 5, sat: 6 };
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const DAY_NUM = "(\\d{1,2})(?:st|nd|rd|th)?";
const END = "(?=$|[\\s,.;!?])";
const START = "(?:^|\\s)"; // no lookbehind: older Safari would fail to parse the module
const PREFIX = "(?:(?:on|by|due)\\s+)?";

const PRIORITIES: [RegExp, Priority][] = [
  [new RegExp(`${START}(?:!!!|!(?:high|h|urgent|1)|p1)${END}`, "i"), 1],
  [new RegExp(`${START}(?:!!|!(?:medium|med|m|2)|p2)${END}`, "i"), 2],
  [new RegExp(`${START}(?:!(?:low|l|3)|p3)${END}`, "i"), 3],
];

const dow = (day: string) => new Date(`${day}T00:00:00Z`).getUTCDay();
/** Next occurrence of a weekday strictly after `today` (1..7 days ahead), or including today when `inclusive`. */
const nextWeekday = (today: string, target: number, inclusive = false): string => {
  const ahead = (target - dow(today) + 7) % 7;
  return addDays(today, ahead === 0 && !inclusive ? 7 : ahead);
};

const validDay = (y: number, m: number, d: number): string | undefined => {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? date.toISOString().slice(0, 10) : undefined;
};

/** A month/day without a year means this year, or next year once it has passed. */
const monthDay = (today: string, month: string, day: string): string | undefined => {
  const m = MONTHS.indexOf(month.slice(0, 3).toLowerCase()) + 1;
  const y = Number(today.slice(0, 4));
  const d = validDay(y, m, Number(day));
  return d && d < today ? validDay(y + 1, m, Number(day)) : d;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Removes the first match of `re` from `s`, returning the match (or null) and the rest. */
const take = (s: string, re: RegExp): [RegExpExecArray | null, string] => {
  const m = re.exec(s);
  return m ? [m, s.slice(0, m.index) + " " + s.slice(m.index + m[0].length)] : [null, s];
};

type DateRule = [RegExp, (m: RegExpExecArray, today: string) => string | undefined];
const DATE_RULES: DateRule[] = [
  [new RegExp(`${START}${PREFIX}(\\d{4})-(\\d{2})-(\\d{2})${END}`, "i"), (m) => validDay(+m[1], +m[2], +m[3])],
  [new RegExp(`${START}${PREFIX}${MONTH}\\s+${DAY_NUM}${END}`, "i"), (m, today) => monthDay(today, m[1], m[2])],
  [new RegExp(`${START}${PREFIX}${DAY_NUM}\\s+${MONTH}${END}`, "i"), (m, today) => monthDay(today, m[2], m[1])],
  [new RegExp(`${START}in\\s+(\\d{1,3}|a|an|one)\\s+(days?|weeks?)${END}`, "i"), (m, today) => {
    const n = /^\d+$/.test(m[1]) ? Number(m[1]) : 1;
    return addDays(today, m[2].toLowerCase().startsWith("w") ? n * 7 : n);
  }],
  [new RegExp(`${START}next\\s+week${END}`, "i"), (_, today) => addDays(today, 7)],
  [new RegExp(`${START}${PREFIX}(today|tod|tonight)${END}`, "i"), (_, today) => today],
  [new RegExp(`${START}${PREFIX}(tomorrow|tmrw?|tmr)${END}`, "i"), (_, today) => addDays(today, 1)],
  [new RegExp(`${START}(?:(?:on|by|due|next|this)\\s+)?(${WEEKDAYS.join("|")})${END}`, "i"), (m, today) => nextWeekday(today, WEEKDAYS.indexOf(m[1].toLowerCase()))],
  [new RegExp(`${START}(?:on|by|due|next|this)\\s+(${Object.keys(SHORT_DAYS).join("|")})${END}`, "i"), (m, today) => nextWeekday(today, SHORT_DAYS[m[1].toLowerCase()])],
];

const TIME_12 = new RegExp(`${START}(?:(?:at|@)\\s*)?(\\d{1,2})(?::([0-5]\\d))?\\s?(am|pm)${END}`, "i");
const TIME_24 = new RegExp(`${START}(?:(?:at|@)\\s*)?([01]?\\d|2[0-3]):([0-5]\\d)${END}`, "i");
const NOON = new RegExp(`${START}(?:at\\s+)?(noon|midday)${END}`, "i");

const parseTime = (s: string): [string | undefined, string] => {
  let [m, rest] = take(s, TIME_12);
  if (m) {
    const h = Number(m[1]);
    if (h >= 1 && h <= 12) return [`${pad((h % 12) + (m[3].toLowerCase() === "pm" ? 12 : 0))}:${m[2] ?? "00"}`, rest];
  }
  [m, rest] = take(s, TIME_24);
  if (m) return [`${pad(Number(m[1]))}:${m[2]}`, rest];
  [m, rest] = take(s, NOON);
  return m ? ["12:00", rest] : [undefined, s];
};

/**
 * Parses quick-add text. Recognises `#labels`, priorities (`!high`, `!!`, `p3`), repeats (`daily`,
 * `every week`, `every monday`), dates (`today`, `tomorrow`, weekdays, `in 3 days`, `next week`,
 * `jan 5`, `2026-01-05`) and times (`5pm`, `at 17:30`, `noon`). With `dates: false` (a date was picked
 * by hand) date words are left in the title. A time without a date means today. If nothing but tokens
 * remain, the original text is kept as the title so nothing is lost.
 */
export function parseQuickAdd(input: string, today: string, opts: { dates?: boolean } = {}): QuickAdd {
  const { text: noLabels, labels } = parseLabels(input);
  let s = noLabels;
  const out: QuickAdd = { text: "", labels };

  for (const [re, p] of PRIORITIES) {
    const [m, rest] = take(s, re);
    if (m) {
      out.priority = p;
      s = rest;
      break;
    }
  }

  let m: RegExpExecArray | null;
  [m, s] = take(s, new RegExp(`${START}(?:every\\s*day|daily|everyday)${END}`, "i"));
  if (m) out.repeat = "daily";
  else {
    [m, s] = take(s, new RegExp(`${START}every\\s+(${WEEKDAYS.join("|")}|${Object.keys(SHORT_DAYS).join("|")})${END}`, "i"));
    if (m) {
      out.repeat = "weekly";
      const w = m[1].toLowerCase();
      if (opts.dates !== false) out.due = nextWeekday(today, w in SHORT_DAYS ? SHORT_DAYS[w] : WEEKDAYS.indexOf(w), true);
    } else {
      [m, s] = take(s, new RegExp(`${START}(?:every\\s+week|weekly)${END}`, "i"));
      if (m) out.repeat = "weekly";
    }
  }

  let tonight = false;
  if (opts.dates !== false && !out.due) {
    for (const [re, toDay] of DATE_RULES) {
      const [hit, rest] = take(s, re);
      const day = hit ? toDay(hit, today) : undefined;
      if (hit && day) {
        out.due = day;
        tonight = /tonight/i.test(hit[0]);
        s = rest;
        break;
      }
    }
  }

  const [time, rest] = parseTime(s);
  if (time) {
    out.time = time;
    s = rest;
  } else if (tonight) out.time = "20:00";
  if (out.time && !out.due && opts.dates !== false) out.due = today;

  out.text = s.replace(/\s+/g, " ").trim();
  if (!out.text) return { text: noLabels.trim(), labels };
  return out;
}

/** True when quick add found anything beyond the plain title (used to show a live preview). */
export const hasTokens = (q: QuickAdd): boolean => !!(q.due || q.time || q.priority || q.repeat || q.labels.length);
