import type { SiteLocale } from "@/lib/metadata";

/**
 * Titles and descriptions of the article and book review list pages, one
 * table for both languages (publication-list-routes.tsx). The photo list
 * keeps its own in src/content/photos/photo-list-seo.ts.
 */
export const publicationListSeo = {
  article: {
    tr: {
      title: "Makaleler | Şaban Durali",
      description:
        "Gayrimenkul, yapay zekâ, satış, müzakere, kitaplar ve araştırma üzerine makaleler.",
    },
    en: {
      title: "Articles | Şaban Durali",
      description:
        "Articles on real estate, artificial intelligence, sales, negotiation, books and research.",
    },
  },
  bookReview: {
    tr: {
      title: "Kitaplar | Şaban Durali",
      description:
        "İş, psikoloji, öğrenme, yapay zekâ, satış, gayrimenkul ve kişisel gelişim alanlarında kitap incelemeleri.",
    },
    en: {
      title: "Books | Şaban Durali",
      description:
        "Book reviews on business, psychology, learning, artificial intelligence, sales, real estate and personal development.",
    },
  },
} as const satisfies Record<
  "article" | "bookReview",
  Record<SiteLocale, { title: string; description: string }>
>;
