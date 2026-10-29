/**
 * Built-in texts of the publication pages that the content layer does not
 * provide (breadcrumbs, counts, filter and section labels). Plural forms:
 * Turkish nouns do not change after a number; English ones do.
 */
export type PublicationCopy = {
  home: string;
  homePath: string;
  allArticles: string;
  allBooks: string;
  allPhotos: string;
  articleCount: (count: number) => string;
  bookCount: (count: number) => string;
  photoCount: (count: number) => string;
};

export const publicationCopy = {
  tr: {
    home: "Ana sayfa",
    homePath: "/",
    allArticles: "Tüm makaleler",
    allBooks: "Tüm kitap incelemeleri",
    allPhotos: "Fotoğraflar",
    articleCount: (count) => `${count} makale`,
    bookCount: (count) => `${count} kitap incelemesi`,
    photoCount: (count) => `${count} fotoğraf`,
  },
  en: {
    home: "Home",
    homePath: "/en",
    allArticles: "All articles",
    allBooks: "All book reviews",
    allPhotos: "Photographs",
    articleCount: (count) => `${count} ${count === 1 ? "article" : "articles"}`,
    bookCount: (count) =>
      `${count} ${count === 1 ? "book review" : "book reviews"}`,
    photoCount: (count) =>
      `${count} ${count === 1 ? "photograph" : "photographs"}`,
  },
} as const satisfies Record<"tr" | "en", PublicationCopy>;
