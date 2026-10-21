import { getAbsoluteUrl } from "@/config/site";
import type {
  BookReview,
  BookReviewLanguage,
} from "@/content/books/types";

export const bookListPaths = {
  tr: "/kitaplar",
  en: "/en/books",
} as const satisfies Record<BookReviewLanguage, string>;

export const bookListUrls = {
  "tr-TR": getAbsoluteUrl(bookListPaths.tr),
  en: getAbsoluteUrl(bookListPaths.en),
  "x-default": getAbsoluteUrl(bookListPaths.tr),
} as const;

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

export function getBookReviewAlternateUrls(
  bookReview: BookReview,
  translation: BookReview | null,
): Record<string, string> {
  const currentUrl = getBookReviewUrl(
    bookReview.slug,
    bookReview.language,
  );
  const urls: Record<string, string> = {
    [bookReview.language === "tr" ? "tr-TR" : "en"]: currentUrl,
  };

  if (translation !== null) {
    urls[translation.language === "tr" ? "tr-TR" : "en"] =
      getBookReviewUrl(translation.slug, translation.language);
  }

  urls["x-default"] = urls["tr-TR"] ?? currentUrl;

  return urls;
}
