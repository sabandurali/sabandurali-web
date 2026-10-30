/**
 * Letters that Unicode decomposition (NFKD) does not reduce to ASCII: the
 * Turkish ones (dotless ı, dotted İ and the cedilla/breve letters, upper and
 * lower case) and a few other Latin letters an English or European title may
 * contain. Everything else outside `a-z0-9` becomes a separator.
 */
const FOLDED_LETTERS: Readonly<Record<string, string>> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
  ß: "ss",
  æ: "ae",
  Æ: "ae",
  œ: "oe",
  Œ: "oe",
  ø: "o",
  Ø: "o",
  ł: "l",
  Ł: "l",
  đ: "d",
  Đ: "d",
  ð: "d",
  Ð: "d",
  þ: "th",
  Þ: "th",
};

const FOLDED_LETTER_PATTERN = new RegExp(
  `[${Object.keys(FOLDED_LETTERS).join("")}]`,
  "g",
);

/**
 * The URL slug contract of every content type: lowercase ASCII letters and
 * digits in groups joined by single hyphens. `createSlug` only produces such
 * values (or `""`), and `src/lib/revalidation.ts` revalidates exactly these.
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * The one slug normalizer of the site (articles, pages, books, photos,
 * collections, categories and tags): Turkish and other Latin letters folded
 * to ASCII, accents and apostrophes dropped, every other run of characters
 * turned into one "-". A title in another script yields `""`; the slug
 * fields then ask the editor for a Latin slug instead of publishing a
 * percent-encoded URL.
 */
export function createSlug(title: string): string {
  return title
    .replace(
      FOLDED_LETTER_PATTERN,
      (letter) => FOLDED_LETTERS[letter] ?? letter,
    )
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/['’ʼ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** True when `value` is already a slug `createSlug` would keep unchanged. */
export function isSlug(value: unknown): value is string {
  return typeof value === "string" && SLUG_PATTERN.test(value);
}

/** The editor-facing statement of {@link SLUG_PATTERN}. */
export const SLUG_RULE_MESSAGE =
  "Slug yalnız küçük Latin harfleri (a-z), rakamlar ve tek tirelerden oluşmalıdır; Türkçe harfler otomatik dönüştürülür.";
