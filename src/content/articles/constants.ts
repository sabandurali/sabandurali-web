import type {
  ArticleCategory,
  ArticleLanguage,
  ArticleStatus,
  ArticleVisibility,
  FreshnessStatus,
  HeadingLevel,
  SourceType,
  TranslationStatus,
} from "@/content/articles/types";

export const ARTICLE_LANGUAGES = ["tr", "en"] as const satisfies ReadonlyArray<ArticleLanguage>;

export const TRANSLATION_STATUSES = [
  "none",
  "pending",
  "in_progress",
  "completed",
  "outdated",
] as const satisfies ReadonlyArray<TranslationStatus>;

export const ARTICLE_STATUSES = [
  "draft",
  "in_review",
  "scheduled",
  "published",
  "archived",
] as const satisfies ReadonlyArray<ArticleStatus>;

export const ARTICLE_VISIBILITIES = [
  "public",
  "private",
  "unlisted",
  "members_only",
] as const satisfies ReadonlyArray<ArticleVisibility>;

export const FRESHNESS_STATUSES = [
  "current",
  "review_due",
  "outdated",
  "not_reviewed",
] as const satisfies ReadonlyArray<FreshnessStatus>;

export const ARTICLE_CATEGORIES = [
  "real_estate",
  "books_and_learning",
  "artificial_intelligence_and_technology",
  "sales_and_negotiation",
  "research_and_analysis",
  "consulting",
] as const satisfies ReadonlyArray<ArticleCategory>;

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
} as const satisfies Record<
  ArticleCategory,
  Record<ArticleLanguage, string>
>;

export const SOURCE_TYPES = [
  "official_institution",
  "academic_publication",
  "book",
  "report",
  "news",
  "website",
  "legislation",
  "interview",
] as const satisfies ReadonlyArray<SourceType>;

export const HEADING_LEVELS = [
  "h2",
  "h3",
  "h4",
] as const satisfies ReadonlyArray<HeadingLevel>;

export const SEO_DESCRIPTION_RECOMMENDED_LENGTH = {
  min: 140,
  max: 160,
} as const;
