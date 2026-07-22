export type ArticleLanguage = "tr" | "en";

export type TranslationStatus =
  | "none"
  | "pending"
  | "in_progress"
  | "completed"
  | "outdated";

export type ArticleStatus =
  | "draft"
  | "in_review"
  | "scheduled"
  | "published"
  | "archived";

export type ArticleVisibility =
  | "public"
  | "private"
  | "unlisted"
  | "members_only";

export type FreshnessStatus =
  | "current"
  | "review_due"
  | "outdated"
  | "not_reviewed";

export type ArticleCategory =
  | "real_estate"
  | "books_and_learning"
  | "artificial_intelligence_and_technology"
  | "sales_and_negotiation"
  | "research_and_analysis"
  | "consulting";

export type SourceType =
  | "official_institution"
  | "academic_publication"
  | "book"
  | "report"
  | "news"
  | "website"
  | "legislation"
  | "interview";

export type HeadingLevel = "h2" | "h3" | "h4";

export type ArticleTag = {
  id: string;
  slug: string;
  labelTr: string;
  labelEn: string;
  aliases: ReadonlyArray<string>;
};

export type ArticleContributor = {
  id: string;
  name: string;
  role?: string;
};

export type CoverImage = {
  src: string;
  alt: string;
  caption?: string;
  source?: string;
  copyrightOwner?: string;
  license?: string;
  width: number;
  height: number;
};

export type ArticleSeo = {
  title: string;
  description: string;
  canonical?: string;
  index: boolean;
  follow: boolean;
  openGraphTitle?: string;
  openGraphDescription?: string;
  openGraphImage?: string;
};

export type ArticleSource = {
  id: string;
  title: string;
  authorOrInstitution: string;
  url?: string;
  publishedAt?: string;
  accessedAt?: string;
  sourceType: SourceType;
  note?: string;
};

export type ArticleFaq = {
  id: string;
  question: string;
  answer: string;
  order: number;
  visible: boolean;
};

export type RelatedArticle = {
  articleId: string;
  relation: "recommended" | "series" | "prerequisite" | "follow_up";
  order: number;
};

export type LegalNotice = {
  required: boolean;
  text?: string;
};

export type ContentBlockBase = {
  id: string;
};

export type ParagraphBlock = ContentBlockBase & {
  type: "paragraph";
  text: string;
};

export type HeadingBlock = ContentBlockBase & {
  type: "heading";
  level: HeadingLevel;
  text: string;
};

export type BulletListBlock = ContentBlockBase & {
  type: "bullet_list";
  items: ReadonlyArray<string>;
};

export type NumberedListBlock = ContentBlockBase & {
  type: "numbered_list";
  items: ReadonlyArray<string>;
};

export type QuoteBlock = ContentBlockBase & {
  type: "quote";
  text: string;
  attribution?: string;
};

export type ImageBlock = ContentBlockBase & {
  type: "image";
  image: CoverImage;
};

export type GalleryBlock = ContentBlockBase & {
  type: "gallery";
  images: ReadonlyArray<CoverImage>;
};

export type VideoBlock = ContentBlockBase & {
  type: "video";
  src: string;
  title: string;
  caption?: string;
  transcript?: string;
};

export type TableBlock = ContentBlockBase & {
  type: "table";
  caption?: string;
  headers: ReadonlyArray<string>;
  rows: ReadonlyArray<ReadonlyArray<string>>;
};

export type InfoBoxBlock = ContentBlockBase & {
  type: "info_box";
  title?: string;
  text: string;
};

export type WarningBoxBlock = ContentBlockBase & {
  type: "warning_box";
  title?: string;
  text: string;
};

export type StatisticBlock = ContentBlockBase & {
  type: "statistic";
  value: string;
  label: string;
  sourceId?: string;
};

export type DownloadBlock = ContentBlockBase & {
  type: "download";
  label: string;
  href: string;
  fileType?: string;
  fileSize?: string;
};

export type ButtonBlock = ContentBlockBase & {
  type: "button";
  label: string;
  href: string;
  variant?: "primary" | "secondary";
};

export type DividerBlock = ContentBlockBase & {
  type: "divider";
};

export type FaqBlock = ContentBlockBase & {
  type: "faq";
  faqIds: ReadonlyArray<string>;
};

export type SourcesBlock = ContentBlockBase & {
  type: "sources";
  sourceIds: ReadonlyArray<string>;
};

export type ArticleContentBlock =
  | ParagraphBlock
  | HeadingBlock
  | BulletListBlock
  | NumberedListBlock
  | QuoteBlock
  | ImageBlock
  | GalleryBlock
  | VideoBlock
  | TableBlock
  | InfoBoxBlock
  | WarningBoxBlock
  | StatisticBlock
  | DownloadBlock
  | ButtonBlock
  | DividerBlock
  | FaqBlock
  | SourcesBlock;

export type ArticleVersionSummary = {
  version: number;
  createdAt: string;
  createdBy: ArticleContributor;
  changeSummary: string;
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  language: ArticleLanguage;
  translationGroupId: string | null;
  translationStatus: TranslationStatus;
  translationSourceArticleId?: string;
  translationSourceUpdatedAt?: string;
  summary: string;
  content: ReadonlyArray<ArticleContentBlock>;
  coverImage: CoverImage | null;
  category: ArticleCategory | null;
  tags: ReadonlyArray<ArticleTag>;
  author: ArticleContributor | null;
  editor: ArticleContributor | null;
  reviewer: ArticleContributor | null;
  status: ArticleStatus;
  visibility: ArticleVisibility;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastVerifiedAt: string | null;
  nextReviewAt: string | null;
  freshnessStatus: FreshnessStatus;
  featured: boolean;
  showOnHomepage: boolean;
  seo: ArticleSeo;
  sources: ReadonlyArray<ArticleSource>;
  faq: ReadonlyArray<ArticleFaq>;
  relatedArticles: ReadonlyArray<RelatedArticle>;
  legalNotice: LegalNotice | null;
  versionHistory: ReadonlyArray<ArticleVersionSummary>;
};

export type ValidationIssue = {
  code: string;
  path: string;
  message: string;
};

export type ArticleValidationResult = {
  valid: boolean;
  errors: ReadonlyArray<ValidationIssue>;
  warnings: ReadonlyArray<ValidationIssue>;
};

export type ArticleValidationOptions = {
  forPublication?: boolean;
};
