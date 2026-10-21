import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/config/site";
import { getAvailableLocalBookImage } from "@/content/books/book-images";
import {
  getBookReviewAlternateUrls,
  getBookReviewUrl,
} from "@/content/books/book-routes";
import type { BookReview } from "@/content/books/types";

export function getBookReviewCanonicalUrl(bookReview: BookReview): string {
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
  const canonical = getBookReviewCanonicalUrl(bookReview);
  const openGraphImage = getAvailableLocalBookImage(
    bookReview.seo.openGraphImage,
  );

  return {
    title: bookReview.seo.title,
    description: bookReview.seo.description,
    alternates: {
      canonical,
      languages: getBookReviewAlternateUrls(bookReview, translation),
    },
    robots: {
      index: bookReview.seo.index,
      follow: bookReview.seo.follow,
    },
    openGraph: {
      title: bookReview.seo.openGraphTitle ?? bookReview.seo.title,
      description:
        bookReview.seo.openGraphDescription ?? bookReview.seo.description,
      url: canonical,
      siteName: "Şaban Durali",
      locale: bookReview.language === "tr" ? "tr_TR" : "en_US",
      alternateLocale:
        translation === null
          ? undefined
          : translation.language === "tr"
            ? "tr_TR"
            : "en_US",
      type: "article",
      publishedTime: bookReview.publishedAt ?? undefined,
      modifiedTime: bookReview.updatedAt,
      images:
        openGraphImage === null
          ? undefined
          : [
              {
                url: openGraphImage,
                alt: bookReview.coverImage?.alt || bookReview.title,
              },
            ],
    },
  };
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
  return JSON.stringify(createBookReviewJsonLd(bookReview)).replace(
    /</g,
    "\\u003c",
  );
}
