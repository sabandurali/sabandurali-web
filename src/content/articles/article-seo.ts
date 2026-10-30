import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/config/site";
import {
  getAvailableLocalArticleImage,
  getAvailablePublicArticleImage,
} from "@/content/articles/article-images";
import { getSafePayloadMediaPath } from "@/content/media-paths";
import { articlePageContent } from "@/content/articles/article-page-content";
import {
  articleListPaths,
  getArticlePath,
  getArticleUrl,
} from "@/content/articles/article-routes";
import {
  createBreadcrumbJsonLd,
  createHomeTrail,
} from "@/content/breadcrumb-seo";
import { citationMetaTags, type CitationInput } from "@/content/citation";
import type {
  PublicArticle,
  PublicArticleSummary,
  PublicArticleTranslation,
} from "@/content/articles/public-types";
import {
  createImageObject,
  createPersonReference,
  createWebsiteReference,
  personalBrandName,
  serializeJsonLd,
} from "@/content/entity-seo";
import { getContentLastModifiedIso } from "@/lib/content-dates";
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

/** Citation of an article: its author line, canonical URL and dates. */
export function articleCitationInput(article: PublicArticle): CitationInput {
  return {
    title: article.title,
    authors: [getArticleAuthorName(article)],
    siteName: personalBrandName,
    url: getArticleCanonicalUrl(article),
    language: article.language,
    publishedAt: article.publishedAt,
    modifiedAt: getContentLastModifiedIso(article) ?? null,
  };
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

  const metadata = createPageMetadata({
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
      modifiedTime: getContentLastModifiedIso(article),
      authors: [getArticleAuthorName(article)],
    },
  });

  // The "How to cite" block's facts as Highwire tags (Google Scholar,
  // Zotero): the same title, author line, canonical URL and date.
  return {
    ...metadata,
    other: citationMetaTags(articleCitationInput(article)),
  };
}

/**
 * The article's trail, named like its visible breadcrumb: home, the list
 * ("Makaleler" / "Articles") and the article at its own address.
 */
export function createArticleBreadcrumbJsonLd(
  article: Pick<PublicArticle, "language" | "slug" | "title">,
) {
  return createBreadcrumbJsonLd(
    createHomeTrail(
      article.language,
      {
        name: articlePageContent[article.language].listTitle,
        path: articleListPaths[article.language],
      },
      {
        name: article.title,
        path: getArticlePath(article.slug, article.language),
      },
    ),
  );
}

/**
 * The BlogPosting of an article page. The site owner publishes every
 * article; the image carries its size only when the media record states it.
 */
export function createArticleJsonLd(article: PublicArticle) {
  const coverImage = getAvailablePublicArticleImage(article.featuredImage);
  const authorName = getArticleAuthorName(article);
  const canonicalUrl = getArticleCanonicalUrl(article);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${canonicalUrl}#article`,
    url: canonicalUrl,
    headline: article.title,
    description: article.summary,
    datePublished: article.publishedAt ?? undefined,
    dateModified: getContentLastModifiedIso(article),
    author:
      authorName === personalBrandName
        ? createPersonReference()
        : {
            "@type": "Person",
            name: authorName,
          },
    publisher: createPersonReference(),
    isPartOf: createWebsiteReference(),
    inLanguage: article.language === "tr" ? "tr-TR" : "en",
    mainEntityOfPage: canonicalUrl,
    image:
      coverImage === null
        ? undefined
        : createImageObject({
            src: coverImage,
            width: article.featuredImage?.width,
            height: article.featuredImage?.height,
          }),
  };
}

/** The article page's JSON-LD: its BlogPosting and its BreadcrumbList. */
export function createArticleStructuredData(article: PublicArticle) {
  const { "@context": context, ...posting } = createArticleJsonLd(article);
  return {
    "@context": context,
    "@graph": [posting, createArticleBreadcrumbJsonLd(article)],
  };
}

export function serializeArticleJsonLd(article: PublicArticle): string {
  return serializeJsonLd(createArticleStructuredData(article));
}
