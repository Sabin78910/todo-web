import { DICTIONARY, detectLang, formatDay, formatNumber, loadLang, saveLang, t } from "./i18n";
import { BADGES } from "./badges";

test("every English key has a non-empty Nepali translation with the same placeholders", () => {
  const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
  for (const [k, v] of Object.entries(DICTIONARY.en)) {
    const ne = DICTIONARY.ne[k as keyof typeof DICTIONARY.en];
    expect(ne, k).toBeTruthy();
    expect(ph(ne), k).toBe(ph(v));
  }
  expect(Object.keys(DICTIONARY.ne)).toEqual(Object.keys(DICTIONARY.en));
});

test("every badge has a label key", () => {
  for (const b of BADGES) expect(DICTIONARY.en).toHaveProperty(`badge.${b.id}`);
});

test("t interpolates params", () => {
  expect(t("en", "left", { n: 3 })).toBe("3 left");
  expect(t("ne", "left", { n: "३" })).toBe("३ बाँकी");
});

test("formats numbers and dates per language", () => {
  expect(formatNumber("en", 12)).toBe("12");
  expect(formatNumber("ne", 12)).toBe("१२");
  expect(formatDay("en", "2026-10-09")).toBe("2026-10-09");
  expect(formatDay("ne", "2026-10-09")).toMatch(/[०-९]/);
});

test("detects language from navigator.language and persists the choice", () => {
  expect(detectLang("ne-NP")).toBe("ne");
  expect(detectLang("en-US")).toBe("en");
  localStorage.clear();
  expect(loadLang()).toBe("en");
  saveLang("ne");
  expect(loadLang()).toBe("ne");
});
