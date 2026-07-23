import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/config/site";
import {
  getAvailableLocalArticleImage,
  getAvailablePublicArticleImage,
  getSafePayloadMediaPath,
} from "@/content/articles/article-images";
import {
  getArticleAlternateUrls,
  getArticleUrl,
} from "@/content/articles/article-routes";
import type {
  PublicArticle,
  PublicArticleTranslation,
} from "@/content/articles/public-types";

export function getArticleCanonicalUrl(article: PublicArticle): string {
  if (article.seo.canonical !== undefined) {
    try {
      return getAbsoluteUrl(article.seo.canonical);
    } catch {
      // Fall through to the route-derived canonical URL.
    }
  }

  return getArticleUrl(article.slug, article.language);
}

export function createArticleMetadata(
  article: PublicArticle,
  translation: PublicArticleTranslation | null,
): Metadata {
  const canonical = getArticleCanonicalUrl(article);
  const openGraphImage =
    article.featuredImage?.source === "payload"
      ? getSafePayloadMediaPath(article.seo.openGraphImage)
      : getAvailableLocalArticleImage(article.seo.openGraphImage);
  const author =
    article.content.source === "static"
      ? article.content.details.author
      : null;

  return {
    title: article.seo.title,
    description: article.seo.description,
    alternates: {
      canonical,
      languages: getArticleAlternateUrls(article, translation),
    },
    robots: {
      index: article.seo.index,
      follow: article.seo.follow,
    },
    openGraph: {
      title: article.seo.openGraphTitle ?? article.seo.title,
      description:
        article.seo.openGraphDescription ?? article.seo.description,
      url: canonical,
      siteName: "Şaban Durali",
      locale: article.language === "tr" ? "tr_TR" : "en_US",
      alternateLocale:
        translation === null
          ? undefined
          : translation.language === "tr"
            ? "tr_TR"
            : "en_US",
      type: "article",
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.updatedAt,
      authors: author === null ? undefined : [author.name],
      images:
        openGraphImage === null
          ? undefined
          : [
              {
                url: openGraphImage,
                alt: article.featuredImage?.alt || article.title,
              },
            ],
    },
  };
}

export function createArticleJsonLd(article: PublicArticle) {
  const coverImage = getAvailablePublicArticleImage(article.featuredImage);
  const author =
    article.content.source === "static"
      ? article.content.details.author
      : null;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.summary,
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.updatedAt,
    author:
      author === null
        ? undefined
        : {
            "@type": "Person",
            name: author.name,
          },
    inLanguage: article.language === "tr" ? "tr-TR" : "en",
    mainEntityOfPage: getArticleCanonicalUrl(article),
    image: coverImage === null ? undefined : getAbsoluteUrl(coverImage),
  };
}

export function serializeArticleJsonLd(article: PublicArticle): string {
  return JSON.stringify(createArticleJsonLd(article)).replace(/</g, "\\u003c");
}
