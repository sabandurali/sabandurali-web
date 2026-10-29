const TURKISH_CHARACTER_MAP: Readonly<Record<string, string>> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  İ: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

function replaceTurkishCharacters(value: string): string {
  return value.replace(
    /[çğıİöşü]/g,
    (character) => TURKISH_CHARACTER_MAP[character] ?? character,
  );
}

/** A URL slug from a title: Turkish letters folded to ASCII, words joined by "-". */
export function createSlug(title: string): string {
  return replaceTurkishCharacters(title.toLocaleLowerCase("tr-TR"))
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}
