import {
  ARTICLE_LANGUAGES,
  SEO_DESCRIPTION_RECOMMENDED_LENGTH,
  TRANSLATION_STATUSES,
} from "@/content/articles/constants";
import type {
  BookCategory,
  BookReviewLanguage,
  BookReviewTranslationStatus,
  ReadingStatus,
  ReviewStatus,
} from "@/content/books/types";

export const BOOK_REVIEW_LANGUAGES =
  ARTICLE_LANGUAGES satisfies ReadonlyArray<BookReviewLanguage>;

export const BOOK_REVIEW_TRANSLATION_STATUSES =
  TRANSLATION_STATUSES satisfies ReadonlyArray<BookReviewTranslationStatus>;

export const BOOK_CATEGORIES = [
  "business_and_management",
  "psychology_and_behavior",
  "sales_and_negotiation",
  "learning_and_education",
  "artificial_intelligence_and_technology",
  "real_estate_and_investment",
  "personal_development",
  "biography_and_history",
  "economics_and_finance",
  "other",
] as const satisfies ReadonlyArray<BookCategory>;

export const BOOK_CATEGORY_LABELS = {
  business_and_management: {
    tr: "İş Dünyası ve Yönetim",
    en: "Business and Management",
  },
  psychology_and_behavior: {
    tr: "Psikoloji ve Davranış",
    en: "Psychology and Behavior",
  },
  sales_and_negotiation: {
    tr: "Satış ve Müzakere",
    en: "Sales and Negotiation",
  },
  learning_and_education: {
    tr: "Öğrenme ve Eğitim",
    en: "Learning and Education",
  },
  artificial_intelligence_and_technology: {
    tr: "Yapay Zekâ ve Teknoloji",
    en: "Artificial Intelligence and Technology",
  },
  real_estate_and_investment: {
    tr: "Gayrimenkul ve Yatırım",
    en: "Real Estate and Investment",
  },
  personal_development: {
    tr: "Kişisel Gelişim",
    en: "Personal Development",
  },
  biography_and_history: {
    tr: "Biyografi ve Tarih",
    en: "Biography and History",
  },
  economics_and_finance: {
    tr: "Ekonomi ve Finans",
    en: "Economics and Finance",
  },
  other: {
    tr: "Diğer",
    en: "Other",
  },
} as const satisfies Record<
  BookCategory,
  Record<BookReviewLanguage, string>
>;

export const READING_STATUSES = [
  "planned",
  "reading",
  "completed",
  "paused",
  "abandoned",
] as const satisfies ReadonlyArray<ReadingStatus>;

export const REVIEW_STATUSES = [
  "draft",
  "in_review",
  "scheduled",
  "published",
  "archived",
] as const satisfies ReadonlyArray<ReviewStatus>;

export const BOOK_RATING = {
  min: 0,
  max: 10,
  decimalPlaces: 1,
} as const;

export const BOOK_REVIEW_SEO_DESCRIPTION_RECOMMENDED_LENGTH =
  SEO_DESCRIPTION_RECOMMENDED_LENGTH;

export const BOOK_QUOTE_WARNING_LENGTH = 300;
