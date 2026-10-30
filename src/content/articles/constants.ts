import type {
  ArticleCategory,
  ArticleLanguage,
} from "@/content/articles/types";

export const ARTICLE_CATEGORY_LABELS = {
  real_estate: {
    tr: "Gayrimenkul",
    en: "Real Estate",
  },
  books_and_learning: {
    tr: "Kitaplar ve Öğrenme",
    en: "Books and Learning",
  },
  artificial_intelligence_and_technology: {
    tr: "Yapay Zekâ ve Teknoloji",
    en: "Artificial Intelligence and Technology",
  },
  sales_and_negotiation: {
    tr: "Satış ve Müzakere",
    en: "Sales and Negotiation",
  },
  research_and_analysis: {
    tr: "Araştırma ve Analiz",
    en: "Research and Analysis",
  },
  consulting: {
    tr: "Danışmanlık",
    en: "Consulting",
  },
} as const satisfies Record<ArticleCategory, Record<ArticleLanguage, string>>;
