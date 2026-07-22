import {
  createArticleSlug,
  normalizeTagValue,
} from "@/content/articles/helpers";
import type { BookTag } from "@/content/books/types";

export const createBookReviewSlug = createArticleSlug;
export const normalizeBookTagValue = normalizeTagValue;

export function findBookTagByName(
  value: string,
  tags: ReadonlyArray<BookTag>,
): BookTag | undefined {
  const normalizedValue = normalizeBookTagValue(value);

  return tags.find((tag) =>
    [tag.slug, tag.labelTr, tag.labelEn, ...tag.aliases]
      .map(normalizeBookTagValue)
      .includes(normalizedValue),
  );
}

export function normalizeIsbn(value: string): string {
  return value.replace(/[\s-]+/g, "").toUpperCase();
}

export function isValidIsbn10(value: string): boolean {
  const isbn = normalizeIsbn(value);

  if (!/^\d{9}[\dX]$/.test(isbn)) {
    return false;
  }

  const checksum = Array.from(isbn).reduce((sum, character, index) => {
    const digit = character === "X" ? 10 : Number(character);
    return sum + digit * (10 - index);
  }, 0);

  return checksum % 11 === 0;
}

export function isValidIsbn13(value: string): boolean {
  const isbn = normalizeIsbn(value);

  if (!/^\d{13}$/.test(isbn)) {
    return false;
  }

  const checksum = Array.from(isbn.slice(0, 12)).reduce(
    (sum, character, index) =>
      sum + Number(character) * (index % 2 === 0 ? 1 : 3),
    0,
  );
  const checkDigit = (10 - (checksum % 10)) % 10;

  return checkDigit === Number(isbn[12]);
}
