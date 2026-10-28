import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/config/site";
import { getAvailableLocalBookImage } from "@/content/books/book-images";
import {
  getBookReviewPath,
  getBookReviewUrl,
} from "@/content/books/book-routes";
import type { BookReview } from "@/content/books/types";
import {
  createPersonReference,
  personalBrandName,
  serializeJsonLd,
} from "@/content/entity-seo";
import { createPageMetadata, createSocialImage } from "@/lib/metadata";

type CanonicalBookReview = Pick<BookReview, "language" | "seo" | "slug">;

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

export function createBookReviewMetadata(
  bookReview: BookReview,
  translation: BookReview | null,
): Metadata {
  const openGraphImage = getAvailableLocalBookImage(
    bookReview.seo.openGraphImage,
  );

  return createPageMetadata({
    title: bookReview.seo.title,
    description: bookReview.seo.description,
    locale: bookReview.language,
    path: getBookReviewPath(bookReview.slug, bookReview.language),
    translations:
      translation === null
        ? undefined
        : {
            [translation.language]: getBookReviewPath(
              translation.slug,
              translation.language,
            ),
          },
    canonical: getBookReviewCanonicalUrl(bookReview),
    images:
      openGraphImage === null
        ? undefined
        : [
            createSocialImage({
              src: openGraphImage,
              alt: bookReview.coverImage?.alt || bookReview.title,
            }),
          ],
    index: bookReview.seo.index,
    follow: bookReview.seo.follow,
    socialTitle: bookReview.seo.openGraphTitle,
    socialDescription: bookReview.seo.openGraphDescription,
    article: {
      publishedTime: bookReview.publishedAt,
      modifiedTime: bookReview.updatedAt,
      authors: [personalBrandName],
    },
  });
}

export function createBookReviewJsonLd(bookReview: BookReview) {
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
  };

  return {
    "@context": "https://schema.org",
    "@type": "Review",
    name: bookReview.title,
    // Every review on the site is written by its owner.
    author: createPersonReference(),
    reviewBody: bookReview.personalEvaluation || bookReview.summary,
    datePublished: bookReview.publishedAt ?? undefined,
    dateModified: bookReview.updatedAt,
    inLanguage: bookReview.language === "tr" ? "tr-TR" : "en",
    url: getBookReviewCanonicalUrl(bookReview),
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

export function serializeBookReviewJsonLd(bookReview: BookReview): string {
  return serializeJsonLd(createBookReviewJsonLd(bookReview));
}
