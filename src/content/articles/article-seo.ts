import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/config/site";
import {
  getAvailableLocalArticleImage,
  getAvailablePublicArticleImage,
  getSafePayloadMediaPath,
} from "@/content/articles/article-images";
import {
  getArticlePath,
  getArticleUrl,
} from "@/content/articles/article-routes";
import type {
  PublicArticle,
  PublicArticleSummary,
  PublicArticleTranslation,
} from "@/content/articles/public-types";
import {
  createPersonReference,
  personalBrandName,
  serializeJsonLd,
} from "@/content/entity-seo";
import {
  createOptimizedSocialImage,
  createPageMetadata,
  createSocialImage,
  type SocialImage,
} from "@/lib/metadata";

type CanonicalArticle = Pick<PublicArticleSummary, "language" | "slug"> & {
  seo: Pick<PublicArticleSummary["seo"], "canonical">;
};

export function getArticleCanonicalUrl(article: CanonicalArticle): string {
  if (article.seo.canonical !== undefined) {
    try {
      return getAbsoluteUrl(article.seo.canonical);
    } catch {
      // Fall through to the route-derived canonical URL.
    }
  }

  return getArticleUrl(article.slug, article.language);
}

/**
 * Whether a version may take part in an hreflang cluster: it is indexable
 * and its canonical URL is its own. The page metadata and the sitemap use
 * the same rule, so both publish the same pairs.
 */
export function isArticleHreflangEligible(
  article: Pick<PublicArticleSummary, "language" | "slug"> & {
    seo: Pick<PublicArticleSummary["seo"], "index" | "canonical">;
  },
): boolean {
  return (
    article.seo.index &&
    getArticleCanonicalUrl(article) ===
      getArticleUrl(article.slug, article.language)
  );
}

/**
 * Static articles name their author in their details; CMS articles carry a
 * guest author only when the editor named someone other than the owner.
 */
export function getArticleAuthorName(article: PublicArticle): string {
  if (article.content.source === "static") {
    return article.content.details.author?.name ?? personalBrandName;
  }

  return article.author ?? personalBrandName;
}

function getArticleSocialImage(article: PublicArticle): SocialImage | null {
  const alt = article.featuredImage?.alt || article.title;

  if (article.featuredImage?.source === "payload") {
    // The CMS uses the featured image itself as the share image.
    const src = getSafePayloadMediaPath(article.seo.openGraphImage);
    const sameAsFeatured = src === article.featuredImage.src;

    return src === null
      ? null
      : createOptimizedSocialImage({
          src,
          alt,
          width: sameAsFeatured ? article.featuredImage.width : undefined,
          height: sameAsFeatured ? article.featuredImage.height : undefined,
        });
  }

  const src = getAvailableLocalArticleImage(article.seo.openGraphImage);
  return src === null ? null : createSocialImage({ src, alt });
}

export function createArticleMetadata(
  article: PublicArticle,
  translation: PublicArticleTranslation | null,
): Metadata {
  const image = getArticleSocialImage(article);
  const hreflang = isArticleHreflangEligible(article);

  return createPageMetadata({
    title: article.seo.title,
    description: article.seo.description,
    locale: article.language,
    path: getArticlePath(article.slug, article.language),
    hreflang,
    translations:
      !hreflang ||
      translation === null ||
      !isArticleHreflangEligible(translation)
        ? undefined
        : {
            [translation.language]: getArticlePath(
              translation.slug,
              translation.language,
            ),
          },
    canonical: getArticleCanonicalUrl(article),
    images: image === null ? undefined : [image],
    index: article.seo.index,
    follow: article.seo.follow,
    socialTitle: article.seo.openGraphTitle,
    socialDescription: article.seo.openGraphDescription,
    article: {
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [getArticleAuthorName(article)],
    },
  });
}

export function createArticleJsonLd(article: PublicArticle) {
  const coverImage = getAvailablePublicArticleImage(article.featuredImage);
  const authorName = getArticleAuthorName(article);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.summary,
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.updatedAt,
    author:
      authorName === personalBrandName
        ? createPersonReference()
        : {
            "@type": "Person",
            name: authorName,
          },
    inLanguage: article.language === "tr" ? "tr-TR" : "en",
    mainEntityOfPage: getArticleCanonicalUrl(article),
    image: coverImage === null ? undefined : getAbsoluteUrl(coverImage),
  };
}

export function serializeArticleJsonLd(article: PublicArticle): string {
  return serializeJsonLd(createArticleJsonLd(article));
}
