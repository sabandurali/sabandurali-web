import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/config/site";
import { getAvailableLocalBookImage } from "@/content/books/book-images";
import { bookPageContent } from "@/content/books/book-page-content";
import {
  bookListPaths,
  getBookReviewPath,
  getBookReviewUrl,
} from "@/content/books/book-routes";
import {
  createBreadcrumbJsonLd,
  createHomeTrail,
} from "@/content/breadcrumb-seo";
import type { PublicBookReview } from "@/content/books/public-types";
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

type CanonicalBookReview = Pick<PublicBookReview, "language" | "seo" | "slug">;

export function getBookReviewCanonicalUrl(
  bookReview: CanonicalBookReview,
): string {
  if (bookReview.seo.canonical !== undefined) {
    try {
      return getAbsoluteUrl(bookReview.seo.canonical);
    } catch {
      // Fall through to the route-derived canonical URL.
    }
  }

  return getBookReviewUrl(bookReview.slug, bookReview.language);
}

/**
 * Whether a review may take part in an hreflang cluster: indexable and
 * self-canonical. The page metadata and the sitemap use the same rule.
 */
export function isBookReviewHreflangEligible(
  bookReview: CanonicalBookReview,
): boolean {
  return (
    bookReview.seo.index &&
    getBookReviewCanonicalUrl(bookReview) ===
      getBookReviewUrl(bookReview.slug, bookReview.language)
  );
}

/** The cover as the page renders it, or null when it is not servable. */
function getBookCover(bookReview: PublicBookReview) {
  const cover = bookReview.coverImage;
  const src = cover === null ? null : getAvailableLocalBookImage(cover.src);

  return cover === null || src === null ? null : { ...cover, src };
}

/**
 * A prepared share image is used as uploaded; otherwise the cover the page
 * shows is shared through the image optimizer, like the featured image of
 * an article. Without either the site-wide image remains.
 */
function getBookReviewSocialImage(
  bookReview: PublicBookReview,
): SocialImage | null {
  const alt = bookReview.coverImage?.alt || bookReview.title;
  const openGraphImage = getAvailableLocalBookImage(
    bookReview.seo.openGraphImage,
  );

  if (openGraphImage !== null) {
    return createSocialImage({ src: openGraphImage, alt });
  }

  const cover = getBookCover(bookReview);

  return cover === null
    ? null
    : createOptimizedSocialImage({
        src: cover.src,
        alt,
        width: cover.width,
        height: cover.height,
      });
}

export function createBookReviewMetadata(
  bookReview: PublicBookReview,
  translation: PublicBookReview | null,
): Metadata {
  const image = getBookReviewSocialImage(bookReview);
  const hreflang = isBookReviewHreflangEligible(bookReview);

  return createPageMetadata({
    title: bookReview.seo.title,
    description: bookReview.seo.description,
    locale: bookReview.language,
    path: getBookReviewPath(bookReview.slug, bookReview.language),
    hreflang,
    translations:
      !hreflang ||
      translation === null ||
      !isBookReviewHreflangEligible(translation)
        ? undefined
        : {
            [translation.language]: getBookReviewPath(
              translation.slug,
              translation.language,
            ),
          },
    canonical: getBookReviewCanonicalUrl(bookReview),
    images: image === null ? undefined : [image],
    index: bookReview.seo.index,
    follow: bookReview.seo.follow,
    socialTitle: bookReview.seo.openGraphTitle,
    socialDescription: bookReview.seo.openGraphDescription,
    article: {
      publishedTime: bookReview.publishedAt,
      modifiedTime: getContentLastModifiedIso(bookReview),
      authors: [personalBrandName],
    },
  });
}

/**
 * The review's trail, named like its visible breadcrumb: home, the list
 * ("Kitaplar" / "Books") and the review at its own address.
 */
export function createBookReviewBreadcrumbJsonLd(
  bookReview: Pick<PublicBookReview, "language" | "slug" | "title">,
) {
  return createBreadcrumbJsonLd(
    createHomeTrail(
      bookReview.language,
      {
        name: bookPageContent[bookReview.language].listTitle,
        path: bookListPaths[bookReview.language],
      },
      {
        name: bookReview.title,
        path: getBookReviewPath(bookReview.slug, bookReview.language),
      },
    ),
  );
}

export function createBookReviewJsonLd(bookReview: PublicBookReview) {
  const cover = getBookCover(bookReview);
  const canonicalUrl = getBookReviewCanonicalUrl(bookReview);
  const book = {
    "@type": "Book",
    name: bookReview.originalTitle ?? bookReview.title,
    author: bookReview.authors.map((author) => ({
      "@type": "Person",
      name: author.name,
    })),
    publisher:
      bookReview.publisher === null
        ? undefined
        : {
            "@type": "Organization",
            name: bookReview.publisher,
          },
    isbn: bookReview.isbn13 ?? bookReview.isbn10 ?? undefined,
    image:
      cover === null
        ? undefined
        : createImageObject({
            src: cover.src,
            width: cover.width,
            height: cover.height,
          }),
  };

  return {
    "@context": "https://schema.org",
    "@type": "Review",
    "@id": `${canonicalUrl}#review`,
    name: bookReview.title,
    // Every review on the site is written and published by its owner.
    author: createPersonReference(),
    publisher: createPersonReference(),
    isPartOf: createWebsiteReference(),
    reviewBody: bookReview.personalEvaluation || bookReview.summary,
    datePublished: bookReview.publishedAt ?? undefined,
    dateModified: getContentLastModifiedIso(bookReview),
    inLanguage: bookReview.language === "tr" ? "tr-TR" : "en",
    url: canonicalUrl,
    itemReviewed: book,
    reviewRating:
      bookReview.rating === null
        ? undefined
        : {
            "@type": "Rating",
            ratingValue: bookReview.rating,
            bestRating: 10,
            worstRating: 0,
          },
  };
}

/** The review page's JSON-LD: its Review and its BreadcrumbList. */
export function createBookReviewStructuredData(bookReview: PublicBookReview) {
  const { "@context": context, ...review } = createBookReviewJsonLd(bookReview);
  return {
    "@context": context,
    "@graph": [review, createBookReviewBreadcrumbJsonLd(bookReview)],
  };
}

export function serializeBookReviewJsonLd(
  bookReview: PublicBookReview,
): string {
  return serializeJsonLd(createBookReviewStructuredData(bookReview));
}
