import assert from "node:assert/strict";
import test from "node:test";
import { siteSocialImage } from "@/config/site";
import { personEntityId } from "@/content/entity-seo";
import { bookPageContent } from "./book-page-content";
import {
  createBookReviewJsonLd,
  createBookReviewMetadata,
  createBookReviewStructuredData,
  getBookReviewCanonicalUrl,
  isBookReviewHreflangEligible,
  serializeBookReviewJsonLd,
} from "./book-seo";
import type { BookReview } from "./types";

const site = "https://www.sabandurali.com";

function review(overrides: Partial<BookReview> = {}): BookReview {
  return {
    id: "review-tr",
    title: "Ultra Öğrenme incelemesi",
    slug: "ultra-ogrenme",
    language: "tr",
    translationGroupId: null,
    translationStatus: "none",
    originalTitle: "Ultralearning",
    authors: [{ id: "author", name: "Scott H. Young", slug: "scott-h-young" }],
    translator: null,
    publisher: "Harper Business",
    originalPublisher: null,
    publicationYear: 2019,
    originalPublicationYear: null,
    edition: null,
    isbn10: null,
    isbn13: "9780062852687",
    pageCount: null,
    coverImage: {
      src: "/books/ultralearning.jpg",
      alt: "Ultralearning kapağı",
      width: 600,
      height: 900,
    },
    category: "learning_and_education",
    tags: [],
    readingStatus: "completed",
    reviewStatus: "published",
    startedAt: null,
    completedAt: null,
    summary: "Özet",
    keyIdeas: [],
    strengths: [],
    weaknesses: [],
    whoShouldRead: [],
    whoShouldNotRead: [],
    applicationNotes: [],
    personalEvaluation: "Değerlendirme",
    rating: 8,
    quotes: [],
    relatedBookIds: [],
    authorId: null,
    editorId: null,
    featured: false,
    showOnHomepage: false,
    seo: {
      title: "Ultra Öğrenme | Şaban Durali",
      description: "Kitap incelemesi",
      index: true,
      follow: true,
    },
    createdAt: "2026-03-01T09:00:00.000Z",
    updatedAt: "2026-03-02T09:00:00.000Z",
    publishedAt: "2026-03-01T09:00:00.000Z",
    ...overrides,
  };
}

test("Review JSON-LD names the site owner as its author", () => {
  const jsonLd = createBookReviewJsonLd(review());

  assert.equal(jsonLd["@type"], "Review");
  assert.deepEqual(jsonLd.author, {
    "@type": "Person",
    "@id": personEntityId,
    name: "Şaban Durali",
    url: `${site}/`,
  });
  assert.equal(jsonLd.itemReviewed["@type"], "Book");
  assert.equal(jsonLd.reviewRating?.ratingValue, 8);
  assert.ok(serializeBookReviewJsonLd(review()).includes(personEntityId));
});

test("review metadata emits hreflang pair, OG article, Twitter and a default image", () => {
  const english = review({
    id: "review-en",
    slug: "ultralearning",
    language: "en",
    translationSourceBookReviewId: "review-tr",
  });
  const metadata = createBookReviewMetadata(review(), english);

  assert.equal(
    metadata.alternates?.canonical,
    `${site}/kitaplar/ultra-ogrenme`,
  );
  assert.deepEqual(metadata.alternates?.languages, {
    "tr-TR": `${site}/kitaplar/ultra-ogrenme`,
    en: `${site}/en/books/ultralearning`,
    "x-default": `${site}/kitaplar/ultra-ogrenme`,
  });
  assert.deepEqual(metadata.openGraph, {
    title: "Ultra Öğrenme | Şaban Durali",
    description: "Kitap incelemesi",
    url: `${site}/kitaplar/ultra-ogrenme`,
    siteName: "Şaban Durali",
    locale: "tr_TR",
    alternateLocale: ["en_US"],
    images: [siteSocialImage],
    type: "article",
    publishedTime: "2026-03-01T09:00:00.000Z",
    modifiedTime: "2026-03-02T09:00:00.000Z",
    authors: ["Şaban Durali"],
  });
  assert.deepEqual(metadata.twitter, {
    card: "summary_large_image",
    title: "Ultra Öğrenme | Şaban Durali",
    description: "Kitap incelemesi",
    images: [siteSocialImage],
  });
});

test("a prepared CMS share image is used as uploaded and noindex is kept", () => {
  const metadata = createBookReviewMetadata(
    review({
      seo: {
        title: "T",
        description: "D",
        index: false,
        follow: true,
        openGraphImage: "/api/media/file/kapak-paylasim.jpg",
      },
    }),
    null,
  );

  assert.deepEqual(metadata.twitter?.images, [
    {
      url: `${site}/api/media/file/kapak-paylasim.jpg`,
      alt: "Ultralearning kapağı",
    },
  ]);
  assert.deepEqual(metadata.robots, { index: false, follow: true });
  // A noindex page is in no hreflang cluster (the sitemap leaves it out too).
  assert.equal(metadata.alternates?.languages, undefined);
});

test("hreflang pairs only indexable, self-canonical reviews", () => {
  const english = review({
    id: "review-en",
    slug: "ultralearning",
    language: "en",
    translationSourceBookReviewId: "review-tr",
  });

  for (const seo of [
    { ...english.seo, index: false },
    { ...english.seo, canonical: "/en/books/another-review" },
  ]) {
    const metadata = createBookReviewMetadata(review(), { ...english, seo });
    assert.equal(metadata.alternates?.languages, undefined);
  }

  const noindex = createBookReviewMetadata(
    review({ seo: { ...review().seo, index: false } }),
    english,
  );
  assert.equal(noindex.alternates?.languages, undefined);
  assert.equal(isBookReviewHreflangEligible(english), true);
});

test("a scheduled review never reports a modification before publication", () => {
  const scheduled = review({
    publishedAt: "2026-10-10T09:00:00.000Z",
    updatedAt: "2026-10-01T09:00:00.000Z",
  });
  const openGraph = createBookReviewMetadata(scheduled, null).openGraph;

  assert.equal(
    createBookReviewJsonLd(scheduled).dateModified,
    "2026-10-10T09:00:00.000Z",
  );
  assert.ok(openGraph && "modifiedTime" in openGraph);
  assert.equal(openGraph.modifiedTime, "2026-10-10T09:00:00.000Z");
});

test("SEO-PERF-2: the cover is the share image and the Book image", () => {
  const withCover = review({
    coverImage: {
      src: "/api/media/file/ultralearning-kapak.jpg",
      alt: "Ultralearning kapağı",
      width: 1600,
      height: 2400,
    },
  });
  const image = {
    url: `${site}/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fultralearning-kapak.jpg&w=1200&q=75`,
    alt: "Ultralearning kapağı",
    width: 1200,
    height: 1800,
  };
  const metadata = createBookReviewMetadata(withCover, null);

  assert.deepEqual(metadata.twitter?.images, [image]);
  assert.ok(metadata.openGraph && "images" in metadata.openGraph);
  assert.deepEqual(metadata.openGraph.images, [image]);
  assert.deepEqual(createBookReviewJsonLd(withCover).itemReviewed.image, {
    "@type": "ImageObject",
    url: `${site}/api/media/file/ultralearning-kapak.jpg`,
    width: withCover.coverImage?.width,
    height: withCover.coverImage?.height,
  });
});

test("SEO-PERF-2: a missing or unservable cover keeps the site image", () => {
  // The fixture cover is not a file in public/, so the page shows none.
  assert.deepEqual(createBookReviewMetadata(review(), null).twitter?.images, [
    siteSocialImage,
  ]);
  assert.equal(createBookReviewJsonLd(review()).itemReviewed.image, undefined);
  assert.equal(
    createBookReviewJsonLd(review({ coverImage: null })).itemReviewed.image,
    undefined,
  );
});

test("ARTICLE-BOOK-JSONLD: a Review names its publisher and the site", () => {
  const jsonLd = createBookReviewJsonLd(review());
  assert.equal(jsonLd["@id"], `${site}/kitaplar/ultra-ogrenme#review`);
  assert.equal(jsonLd.publisher["@id"], personEntityId);
  assert.deepEqual(jsonLd.isPartOf, {
    "@type": "WebSite",
    "@id": `${site}/#website`,
    name: "Şaban Durali",
    url: `${site}/`,
  });
});

test("BREADCRUMB-JSONLD: the review trail matches the visible one and ends at the canonical URL", () => {
  for (const bookReview of [
    review(),
    review({ language: "en", slug: "ultralearning", title: "Ultralearning" }),
  ]) {
    const graph = createBookReviewStructuredData(bookReview)["@graph"];
    const breadcrumb = graph.find((node) => node["@type"] === "BreadcrumbList");
    assert.ok(breadcrumb && "itemListElement" in breadcrumb);
    const items = breadcrumb.itemListElement;
    assert.deepEqual(
      items.map((item) => item.name),
      [
        bookReview.language === "tr" ? "Ana sayfa" : "Home",
        bookPageContent[bookReview.language].listTitle,
        bookReview.title,
      ],
    );
    assert.equal(items.at(-1)?.item, getBookReviewCanonicalUrl(bookReview));
  }
  assert.equal(
    JSON.parse(serializeBookReviewJsonLd(review()))["@graph"][0]["@type"],
    "Review",
  );
});
