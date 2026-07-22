import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/config/site";
import { getAvailableLocalArticleImage } from "@/content/articles/article-images";
import {
  getArticleAlternateUrls,
  getArticleUrl,
} from "@/content/articles/article-routes";
import type { Article } from "@/content/articles/types";

export function getArticleCanonicalUrl(article: Article): string {
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
  article: Article,
  translation: Article | null,
): Metadata {
  const canonical = getArticleCanonicalUrl(article);
  const openGraphImage = getAvailableLocalArticleImage(
    article.seo.openGraphImage,
  );

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
      authors: article.author === null ? undefined : [article.author.name],
      images:
        openGraphImage === null
          ? undefined
          : [
              {
                url: openGraphImage,
                alt: article.coverImage?.alt || article.title,
              },
            ],
    },
  };
}

export function createArticleJsonLd(article: Article) {
  const coverImage = getAvailableLocalArticleImage(article.coverImage?.src);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.summary,
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.updatedAt,
    author:
      article.author === null
        ? undefined
        : {
            "@type": "Person",
            name: article.author.name,
          },
    inLanguage: article.language === "tr" ? "tr-TR" : "en",
    mainEntityOfPage: getArticleCanonicalUrl(article),
    image: coverImage === null ? undefined : getAbsoluteUrl(coverImage),
  };
}

export function serializeArticleJsonLd(article: Article): string {
  return JSON.stringify(createArticleJsonLd(article)).replace(/</g, "\\u003c");
}
