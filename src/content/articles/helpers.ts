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

export function createArticleSlug(title: string): string {
  return replaceTurkishCharacters(title.toLocaleLowerCase("tr-TR"))
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}
