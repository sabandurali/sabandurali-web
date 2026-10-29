import { getAbsoluteUrl } from "@/config/site";
import type { BookReview, BookReviewLanguage } from "@/content/books/types";

export const bookListPaths = {
  tr: "/kitaplar",
  en: "/en/books",
} as const satisfies Record<BookReviewLanguage, string>;

export function getBookReviewPath(
  slug: string,
  language: BookReviewLanguage,
): string {
  return `${bookListPaths[language]}/${slug}`;
}

export function getBookReviewUrl(
  slug: string,
  language: BookReviewLanguage,
): string {
  return getAbsoluteUrl(getBookReviewPath(slug, language));
}

export function getBookReviewLanguagePaths(
  bookReview: BookReview,
  translation: BookReview | null,
): Record<BookReviewLanguage, string> {
  const paths: Record<BookReviewLanguage, string> = {
    tr: bookListPaths.tr,
    en: bookListPaths.en,
  };

  paths[bookReview.language] = getBookReviewPath(
    bookReview.slug,
    bookReview.language,
  );

  if (translation !== null) {
    paths[translation.language] = getBookReviewPath(
      translation.slug,
      translation.language,
    );
  }

  return paths;
}
