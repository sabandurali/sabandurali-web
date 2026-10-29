import type {
  DistrictArticleType,
  PublicArticle,
  PublicArticleCategory,
  PublicArticleExternalSource,
  PublicArticleImage,
  PublicArticleSummary,
  PublicArticleTranslation,
} from "@/content/articles/public-types";
import type { ArticleLanguage } from "@/content/articles/types";
import { isSiteCanonicalUrl } from "@/collections/validation";
import { reportContentIssue } from "@/content/content-log";
import {
  getFiniteNumber,
  getText,
  isPublishedBy,
  isRecord,
} from "@/content/guards";
import { personalBrandName } from "@/content/entity-seo";
import { mapMediaImage } from "@/content/media";
import {
  prepareRichText,
  type RichTextLinkContext,
} from "@/content/rich-text/prepare-rich-text";
import type { Article as PayloadArticle } from "@/payload-types";

function hasMeaningfulLexicalNode(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  if (value.type === "text") {
    return getText(value.text) !== null;
  }

  if (value.type === "upload") {
    return true;
  }

  return (
    Array.isArray(value.children) &&
    value.children.some(hasMeaningfulLexicalNode)
  );
}

function isLexicalContent(value: unknown): value is PayloadArticle["content"] {
  return (
    isRecord(value) &&
    isRecord(value.root) &&
    Array.isArray(value.root.children) &&
    value.root.children.some(hasMeaningfulLexicalNode)
  );
}

function reportInvalidArticle(
  articleID: string,
  locale: ArticleLanguage,
  reason: string,
): void {
  reportContentIssue({ scope: "articles", id: articleID, locale, reason });
}

function mapCategory(value: unknown): PublicArticleCategory | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = getText(value.id);
  const name = getText(value.name);
  const slug = getText(value.slug);

  if (id === null || name === null || slug === null) {
    return null;
  }

  return {
    id,
    name,
    slug,
    sortOrder: getFiniteNumber(value.sortOrder) ?? 0,
  };
}

function mapCategories(
  values: PayloadArticle["categories"],
  locale: ArticleLanguage,
): PublicArticleCategory[] {
  const collator = new Intl.Collator(locale === "tr" ? "tr-TR" : "en", {
    sensitivity: "base",
  });

  return (Array.isArray(values) ? values : [])
    .map(mapCategory)
    .filter((category): category is PublicArticleCategory => category !== null)
    .toSorted(
      (left, right) =>
        left.sortOrder - right.sortOrder ||
        collator.compare(left.name, right.name),
    );
}

function getArticleType(value: unknown): DistrictArticleType {
  return value === "district-research" || value === "district-news"
    ? value
    : "article";
}

function mapExternalSource(value: unknown): PublicArticleExternalSource | null {
  if (!isRecord(value)) return null;
  const name = getText(value.name);
  const url = getText(value.url);
  if (name === null || url === null) return null;
  return { name, url, checkedAt: getText(value.checkedAt) };
}

function mapFeaturedImage(
  value: PayloadArticle["featuredImage"],
  localizedAlt: unknown,
  title: string,
  locale: ArticleLanguage,
): PublicArticleImage | null {
  const image = mapMediaImage(value, {
    alt: localizedAlt,
    fallbackAlt: title,
    locale,
  });

  if (image === null) return null;

  return {
    source: "payload",
    src: image.src,
    alt: image.alt,
    ...(image.altLanguage === locale ? {} : { altLanguage: image.altLanguage }),
    ...(image.caption === null ? {} : { caption: image.caption }),
    ...(image.credit === null ? {} : { credit: image.credit }),
    ...(image.width === null ? {} : { width: image.width }),
    ...(image.height === null ? {} : { height: image.height }),
  };
}

export function mapPayloadArticle(
  value: PayloadArticle,
  locale: ArticleLanguage,
  now: Date = new Date(),
  links: RichTextLinkContext = {},
): PublicArticle | null {
  const id = getText(value.id);
  const title = getText(value.title);
  const slug = getText(value.slug);
  const excerpt = getText(value.excerpt);
  const articleType = getArticleType(value.articleType);

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

  // Internal links are resolved here, where the locale is known.
  const content =
    articleType === "district-news"
      ? null
      : prepareRichText(value.content, locale, now, links);

  if (articleType !== "district-news" && !isLexicalContent(content)) {
    reportInvalidArticle(
      id,
      locale,
      "Lexical content is missing for the requested locale",
    );
    return null;
  }

  const externalSource = mapExternalSource(value.externalSource);
  if (articleType === "district-news" && externalSource === null) {
    reportInvalidArticle(id, locale, "news is missing its original source");
    return null;
  }

  if (!isPublishedBy(value.publishedAt, now)) {
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
    locale,
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
      data: isLexicalContent(content) ? content : null,
    },
    categories: mapCategories(value.categories, locale),
    featuredImage,
    featured: value.featured === true,
    articleType,
    district: getText(value.district),
    districtNeighborhood: getText(value.districtNeighborhood),
    newsCategory: getText(value.newsCategory),
    externalSource,
    publishedAt: value.publishedAt,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    ...mapAuthor(value.author),
    seo: {
      title: getText(value.seo?.metaTitle) ?? title,
      description: getText(value.seo?.metaDescription) ?? excerpt,
      ...mapCanonical(value.seo?.canonical),
      index: value.seo?.index !== false,
      follow: value.seo?.follow !== false,
      openGraphImage: featuredImage?.src,
    },
  };
}

/** A canonical path or URL on this site; anything else is ignored. */
function mapCanonical(value: unknown): { canonical?: string } {
  const canonical = getText(value);
  return canonical !== null && isSiteCanonicalUrl(canonical)
    ? { canonical }
    : {};
}

/** A guest author's name; empty or the owner's name means the owner. */
function mapAuthor(value: unknown): { author?: string } {
  const name = isRecord(value) ? getText(value.name) : null;
  return name === null || name === personalBrandName ? {} : { author: name };
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
    articleType: article.articleType,
    district: article.district,
    districtNeighborhood: article.districtNeighborhood,
    newsCategory: article.newsCategory,
    externalSource: article.externalSource,
    publishedAt: article.publishedAt,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    ...(article.author === undefined ? {} : { author: article.author }),
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
