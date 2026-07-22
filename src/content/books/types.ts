import type {
  ArticleLanguage,
  ArticleSeo,
  CoverImage,
  TranslationStatus,
  ValidationIssue,
} from "@/content/articles/types";

export type BookReviewLanguage = ArticleLanguage;
export type BookReviewTranslationStatus = TranslationStatus;
export type BookCoverImage = CoverImage;
export type BookReviewSeo = ArticleSeo;

export type BookCategory =
  | "business_and_management"
  | "psychology_and_behavior"
  | "sales_and_negotiation"
  | "learning_and_education"
  | "artificial_intelligence_and_technology"
  | "real_estate_and_investment"
  | "personal_development"
  | "biography_and_history"
  | "economics_and_finance"
  | "other";

export type ReadingStatus =
  | "planned"
  | "reading"
  | "completed"
  | "paused"
  | "abandoned";

export type ReviewStatus =
  | "draft"
  | "in_review"
  | "scheduled"
  | "published"
  | "archived";

export type BookAuthor = {
  id: string;
  name: string;
  slug: string;
};

export type BookTag = {
  id: string;
  slug: string;
  labelTr: string;
  labelEn: string;
  aliases: ReadonlyArray<string>;
};

export type BookKeyIdea = {
  id: string;
  title: string;
  description: string;
  order: number;
};

export type BookApplicationNote = {
  id: string;
  title: string;
  description: string;
  action: string;
  order: number;
};

export type BookQuote = {
  id: string;
  text: string;
  page?: number;
  note?: string;
  order: number;
};

export type BookReview = {
  id: string;
  title: string;
  slug: string;
  language: BookReviewLanguage;
  translationGroupId: string | null;
  translationStatus: BookReviewTranslationStatus;
  translationSourceBookReviewId?: string;
  translationSourceUpdatedAt?: string;
  originalTitle: string | null;
  authors: ReadonlyArray<BookAuthor>;
  translator: string | null;
  publisher: string | null;
  originalPublisher: string | null;
  publicationYear: number | null;
  originalPublicationYear: number | null;
  edition: string | null;
  isbn10: string | null;
  isbn13: string | null;
  pageCount: number | null;
  coverImage: BookCoverImage | null;
  category: BookCategory | null;
  tags: ReadonlyArray<BookTag>;
  readingStatus: ReadingStatus;
  reviewStatus: ReviewStatus;
  startedAt: string | null;
  completedAt: string | null;
  summary: string;
  keyIdeas: ReadonlyArray<BookKeyIdea>;
  strengths: ReadonlyArray<string>;
  weaknesses: ReadonlyArray<string>;
  whoShouldRead: ReadonlyArray<string>;
  whoShouldNotRead: ReadonlyArray<string>;
  applicationNotes: ReadonlyArray<BookApplicationNote>;
  personalEvaluation: string;
  rating: number | null;
  quotes: ReadonlyArray<BookQuote>;
  relatedBookIds: ReadonlyArray<string>;
  authorId: string | null;
  editorId: string | null;
  featured: boolean;
  showOnHomepage: boolean;
  seo: BookReviewSeo;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type BookReviewValidationResult = {
  valid: boolean;
  errors: ReadonlyArray<ValidationIssue>;
  warnings: ReadonlyArray<ValidationIssue>;
};
