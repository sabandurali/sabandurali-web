import type { BookReviewLanguage } from "@/content/books/types";
import { createPublicationRoutes } from "@/content/publication-routes";

export const bookListPaths = {
  tr: "/kitaplar",
  en: "/en/books",
} as const satisfies Record<BookReviewLanguage, string>;

const bookReviewRoutes = createPublicationRoutes(bookListPaths);

export const getBookReviewPath = bookReviewRoutes.getPath;
export const getBookReviewUrl = bookReviewRoutes.getUrl;
export const getBookReviewLanguagePaths = bookReviewRoutes.getLanguagePaths;
