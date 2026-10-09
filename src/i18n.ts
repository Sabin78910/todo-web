export type Lang = "en" | "ne";

const en = {
  "app.today": "Today",
  "lang.label": "Language",
  "goal.label": "Daily goal",
  "install": "Install app",
  "theme.toLight": "Switch to light theme",
  "theme.toDark": "Switch to dark theme",
  "progress.section": "Daily progress",
  "progress.ring": "Daily goal {done} of {goal}",
  "progress.title": "{done} of {goal} done",
  "progress.level": "Progress to next level",
  "progress.pts": "{points} / {next} pts",
  "progress.max": "{points} pts · max level",
  "streak": "{current}-day streak · best {best}",
  "badge.shelf": "Badge shelf",
  "badge.unlocked": "Badge unlocked: {names}",
  "badge.first-task": "First task",
  "badge.streak-3": "3-day streak",
  "badge.streak-7": "7-day streak",
  "badge.tasks-50": "50 tasks done",
  "badge.early-bird": "Early bird",
  "badge.all-done": "All done today",
  "level.Beginner": "Beginner",
  "level.Apprentice": "Apprentice",
  "level.Intermediate": "Intermediate",
  "level.Advanced": "Advanced",
  "level.Expert": "Expert",
  "level.Master": "Master",
  "level.Grand Master": "Grand Master",
  "add.label": "New todo",
  "add.placeholder": "What needs doing?",
  "add.details": "Details",
  "add.submit": "Add",
  "field.due": "Due date",
  "field.priority": "Priority",
  "field.repeat": "Repeat",
  "prio.none": "No priority",
  "prio.noneShort": "None",
  "prio.1": "Priority 1 (high)",
  "prio.2": "Priority 2 (medium)",
  "prio.3": "Priority 3 (low)",
  "prio.short": "P{n}",
  "repeat.none": "No repeat",
  "repeat.daily": "Daily",
  "repeat.weekly": "Weekly",
  "repeat.label": "Repeats {repeat}",
  "filter.group": "Filter",
  "filter.all": "all",
  "filter.active": "active",
  "filter.done": "done",
  "left": "{n} left",
  "sort": "Sort by priority",
  "clear": "Clear done",
  "empty.none": "No todos yet",
  "empty.filtered": "Nothing here",
  "empty.cta": "Add your first task",
  "edit.label": "Edit todo",
  "prio.for": "Priority for {text}",
  "move.up": "Move {text} up",
  "move.down": "Move {text} down",
  "delete": "Delete {text}",
  "due": "due {date}",
} as const;

export type Key = keyof typeof en;

const ne: Record<Key, string> = {
  "app.today": "आज",
  "lang.label": "भाषा",
  "goal.label": "दैनिक लक्ष्य",
  "install": "एप स्थापना गर्नुहोस्",
  "theme.toLight": "उज्यालो थिममा बदल्नुहोस्",
  "theme.toDark": "अँध्यारो थिममा बदल्नुहोस्",
  "progress.section": "दैनिक प्रगति",
  "progress.ring": "दैनिक लक्ष्य {goal} मध्ये {done}",
  "progress.title": "{goal} मध्ये {done} सकियो",
  "progress.level": "अर्को तहसम्मको प्रगति",
  "progress.pts": "{points} / {next} अङ्क",
  "progress.max": "{points} अङ्क · उच्चतम तह",
  "streak": "{current} दिनको क्रम · उत्कृष्ट {best}",
  "badge.shelf": "ब्याज दराज",
  "badge.unlocked": "ब्याज अनलक भयो: {names}",
  "badge.first-task": "पहिलो काम",
  "badge.streak-3": "३ दिनको क्रम",
  "badge.streak-7": "७ दिनको क्रम",
  "badge.tasks-50": "५० काम सकियो",
  "badge.early-bird": "बिहानै उठ्ने",
  "badge.all-done": "आज सबै सकियो",
  "level.Beginner": "शुरुवाती",
  "level.Apprentice": "सिकारु",
  "level.Intermediate": "मध्यम",
  "level.Advanced": "उन्नत",
  "level.Expert": "विशेषज्ञ",
  "level.Master": "निपुण",
  "level.Grand Master": "महानिपुण",
  "add.label": "नयाँ काम",
  "add.placeholder": "के गर्नुपर्छ?",
  "add.details": "विवरण",
  "add.submit": "थप्नुहोस्",
  "field.due": "म्याद",
  "field.priority": "प्राथमिकता",
  "field.repeat": "दोहोर्याउने",
  "prio.none": "प्राथमिकता छैन",
  "prio.noneShort": "छैन",
  "prio.1": "प्राथमिकता १ (उच्च)",
  "prio.2": "प्राथमिकता २ (मध्यम)",
  "prio.3": "प्राथमिकता ३ (न्यून)",
  "prio.short": "प्रा{n}",
  "repeat.none": "दोहोर्याउँदैन",
  "repeat.daily": "दैनिक",
  "repeat.weekly": "साप्ताहिक",
  "repeat.label": "{repeat} दोहोरिन्छ",
  "filter.group": "फिल्टर",
  "filter.all": "सबै",
  "filter.active": "बाँकी",
  "filter.done": "सकिएका",
  "left": "{n} बाँकी",
  "sort": "प्राथमिकताअनुसार मिलाउनुहोस्",
  "clear": "सकिएका हटाउनुहोस्",
  "empty.none": "अहिलेसम्म कुनै काम छैन",
  "empty.filtered": "यहाँ केही छैन",
  "empty.cta": "आफ्नो पहिलो काम थप्नुहोस्",
  "edit.label": "काम सम्पादन",
  "prio.for": "{text} को प्राथमिकता",
  "move.up": "{text} माथि सार्नुहोस्",
  "move.down": "{text} तल सार्नुहोस्",
  "delete": "{text} मेटाउनुहोस्",
  "due": "म्याद {date}",
};

export const DICTIONARY: Record<Lang, Record<Key, string>> = { en, ne };

export const t = (lang: Lang, key: Key, params: Record<string, string | number> = {}): string =>
  DICTIONARY[lang][key].replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`));

const locale = (lang: Lang) => (lang === "ne" ? "ne-NP-u-nu-deva" : "en-US");

export const formatNumber = (lang: Lang, n: number): string => n.toLocaleString(locale(lang));

export const formatDate = (lang: Lang, d: Date, opts: Intl.DateTimeFormatOptions): string =>
  d.toLocaleDateString(locale(lang), opts);

/** Format a YYYY-MM-DD string without timezone shifts. */
export const formatDay = (lang: Lang, day: string): string => {
  if (lang === "en") return day;
  const [y, m, d] = day.split("-").map(Number);
  return formatDate(lang, new Date(y, m - 1, d), { year: "numeric", month: "short", day: "numeric" });
};

export const detectLang = (nav: string = navigator.language): Lang => (nav.toLowerCase().startsWith("ne") ? "ne" : "en");

const KEY = "lang";
export function loadLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "en" || saved === "ne") return saved;
  } catch {
    /* storage unavailable — fall through */
  }
  return detectLang();
}
export function saveLang(lang: Lang): void {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* storage unavailable — ignore */
  }
}
