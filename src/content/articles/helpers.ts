import type { ArticleTag } from "@/content/articles/types";

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
  return value.replace(/[çğıİöşü]/g, (character) =>
    TURKISH_CHARACTER_MAP[character] ?? character,
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

export function normalizeTagValue(value: string): string {
  return replaceTurkishCharacters(value.toLocaleLowerCase("tr-TR"))
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function getTagSearchValues(tag: ArticleTag): ReadonlySet<string> {
  return new Set(
    [tag.slug, tag.labelTr, tag.labelEn, ...tag.aliases]
      .map(normalizeTagValue)
      .filter(Boolean),
  );
}

export function findTagByName(
  value: string,
  tags: ReadonlyArray<ArticleTag>,
): ArticleTag | undefined {
  const normalizedValue = normalizeTagValue(value);

  return tags.find((tag) => getTagSearchValues(tag).has(normalizedValue));
}

export type DuplicateTagGroup = {
  normalizedValue: string;
  tagIds: ReadonlyArray<string>;
};

export function findDuplicateTagGroups(
  tags: ReadonlyArray<ArticleTag>,
): ReadonlyArray<DuplicateTagGroup> {
  const idsByValue = new Map<string, Set<string>>();

  for (const tag of tags) {
    for (const normalizedValue of getTagSearchValues(tag)) {
      const tagIds = idsByValue.get(normalizedValue) ?? new Set<string>();
      tagIds.add(tag.id);
      idsByValue.set(normalizedValue, tagIds);
    }
  }

  return Array.from(idsByValue.entries())
    .filter(([, tagIds]) => tagIds.size > 1)
    .map(([normalizedValue, tagIds]) => ({
      normalizedValue,
      tagIds: Array.from(tagIds),
    }));
}
