import { getSafePayloadMediaPath } from "@/content/articles/article-images";
import type {
  PublicArticle,
  PublicArticleCategory,
  PublicArticleImage,
  PublicArticleSummary,
  PublicArticleTranslation,
} from "@/content/articles/public-types";
import type { ArticleLanguage } from "@/content/articles/types";
import type {
  Article as PayloadArticle,
  Category as PayloadCategory,
  Media as PayloadMedia,
} from "@/payload-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getRequiredText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function hasMeaningfulLexicalNode(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  if (value.type === "text") {
    return getRequiredText(value.text) !== null;
  }

  if (value.type === "upload") {
    return true;
  }

  return (
    Array.isArray(value.children) &&
    value.children.some(hasMeaningfulLexicalNode)
  );
}

function isLexicalContent(
  value: unknown,
): value is PayloadArticle["content"] {
  return (
    isRecord(value) &&
    isRecord(value.root) &&
    Array.isArray(value.root.children) &&
    value.root.children.some(hasMeaningfulLexicalNode)
  );
}

function isPublishedAtPublic(
  value: unknown,
  now: Date,
): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp <= now.getTime();
}

function reportInvalidArticle(
  articleID: string,
  locale: ArticleLanguage,
  reason: string,
): void {
  if (process.env.NODE_ENV === "development") {
    console.warn(
      `[public-articles] Payload article ${articleID} was skipped for locale ${locale}: ${reason}`,
    );
  }
}

function mapCategory(
  value: string | PayloadCategory,
): PublicArticleCategory | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = getRequiredText(value.id);
  const name = getRequiredText(value.name);
  const slug = getRequiredText(value.slug);

  if (id === null || name === null || slug === null) {
    return null;
  }

  return {
    id,
    name,
    slug,
    sortOrder:
      typeof value.sortOrder === "number" && Number.isFinite(value.sortOrder)
        ? value.sortOrder
        : 0,
  };
}

function mapCategories(
  values: PayloadArticle["categories"],
  locale: ArticleLanguage,
): PublicArticleCategory[] {
  const collator = new Intl.Collator(
    locale === "tr" ? "tr-TR" : "en",
    { sensitivity: "base" },
  );

  return values
    .map(mapCategory)
    .filter(
      (category): category is PublicArticleCategory => category !== null,
    )
    .toSorted(
      (left, right) =>
        left.sortOrder - right.sortOrder ||
        collator.compare(left.name, right.name),
    );
}

function getPositiveDimension(value: unknown): number | undefined {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
    ? value
    : undefined;
}

function mapFeaturedImage(
  value: PayloadArticle["featuredImage"],
  localizedAlt: unknown,
  title: string,
): PublicArticleImage | null {
  if (!isRecord(value)) {
    return null;
  }

  const media = value as PayloadMedia;
  const mimeType = getRequiredText(media.mimeType);
  const src = getSafePayloadMediaPath(media.url);

  if (mimeType === null || !mimeType.startsWith("image/") || src === null) {
    return null;
  }

  return {
    source: "payload",
    src,
    alt:
      getRequiredText(localizedAlt) ??
      getRequiredText(media.alt) ??
      title,
    width: getPositiveDimension(media.width),
    height: getPositiveDimension(media.height),
  };
}

export function mapPayloadArticle(
  value: PayloadArticle,
  locale: ArticleLanguage,
  now: Date = new Date(),
): PublicArticle | null {
  const id = getRequiredText(value.id);
  const title = getRequiredText(value.title);
  const slug = getRequiredText(value.slug);
  const excerpt = getRequiredText(value.excerpt);

  if (id === null) {
    return null;
  }

  if (value._status !== "published") {
    reportInvalidArticle(id, locale, "status is not published");
    return null;
  }

  if (title === null || slug === null || excerpt === null) {
    reportInvalidArticle(
      id,
      locale,
      "title, slug or excerpt is missing for the requested locale",
    );
    return null;
  }

  if (!isLexicalContent(value.content)) {
    reportInvalidArticle(
      id,
      locale,
      "Lexical content is missing for the requested locale",
    );
    return null;
  }

  if (!isPublishedAtPublic(value.publishedAt, now)) {
    reportInvalidArticle(
      id,
      locale,
      "publishedAt is missing, invalid or in the future",
    );
    return null;
  }

  const featuredImage = mapFeaturedImage(
    value.featuredImage,
    value.featuredImageAlt,
    title,
  );

  return {
    id,
    title,
    slug,
    language: locale,
    translationKey: id,
    summary: excerpt,
    content: {
      source: "lexical",
      data: value.content,
    },
    categories: mapCategories(value.categories, locale),
    featuredImage,
    featured: value.featured === true,
    publishedAt: value.publishedAt,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    seo: {
      title: getRequiredText(value.seo?.metaTitle) ?? title,
      description:
        getRequiredText(value.seo?.metaDescription) ?? excerpt,
      index: true,
      follow: true,
      openGraphImage: featuredImage?.src,
    },
  };
}

export function toPublicArticleSummary(
  article: PublicArticle,
): PublicArticleSummary {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    language: article.language,
    translationKey: article.translationKey,
    summary: article.summary,
    categories: article.categories,
    featuredImage: article.featuredImage,
    featured: article.featured,
    publishedAt: article.publishedAt,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    seo: article.seo,
  };
}

export function toPublicArticleTranslation(
  article: PublicArticle,
): PublicArticleTranslation {
  return {
    id: article.id,
    language: article.language,
    slug: article.slug,
    title: article.title,
  };
}
