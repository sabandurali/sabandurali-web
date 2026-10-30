/**
 * Search text normalization for Turkish and English.
 *
 * Both the query and the indexed text pass through `normalizeForSearch`, so
 * "Kadıköy", "KADIKÖY", "kadikoy" and "Kadikoy" all meet as "kadikoy":
 *
 * 1. Turkish lower case first (`İ` → `i`, `I` → `ı`), which the default
 *    `toLowerCase` gets wrong (`İ` → `i̇`, `I` → `i`);
 * 2. then the Turkish letters and every other accent fold to plain Latin
 *    (`ı` → `i`, `ş` → `s`, `ğ` → `g`, `ç` → `c`, `ö` → `o`, `ü` → `u`,
 *    `â` → `a`), so a query typed without a Turkish keyboard still matches;
 * 3. punctuation becomes a space and runs of spaces collapse.
 */
const foldedLetters: Readonly<Record<string, string>> = {
  ı: "i",
  ş: "s",
  ğ: "g",
  ç: "c",
  ö: "o",
  ü: "u",
  æ: "ae",
  œ: "oe",
  ß: "ss",
};

export function normalizeForSearch(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .replace(/[ışğçöüæœß]/g, (letter) => foldedLetters[letter] ?? letter)
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** The distinct words of a normalized query, at most `limit` of them. */
export function getSearchTerms(query: string, limit = 8): string[] {
  const normalized = normalizeForSearch(query);
  if (normalized === "") return [];
  return [...new Set(normalized.split(" "))].slice(0, limit);
}
