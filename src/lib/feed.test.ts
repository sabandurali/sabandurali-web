import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import type { PublicBookReviewSummary } from "@/content/books/public-types";
import { toPublicBookReviewSummary } from "@/content/books/public-types";
import type { BookReview } from "@/content/books/types";
import type { PublicPhoto } from "@/content/photos/types";
import {
  buildAtomFeed,
  collectFeedEntries,
  escapeXml,
  feedEntryLimit,
  feedPaths,
  toIstanbulRfc3339,
} from "./feed";
import { createPageMetadata, feedLinks } from "./metadata";

const site = "https://www.sabandurali.com";

function article(
  overrides: Partial<PublicArticleSummary> &
    Pick<PublicArticleSummary, "id" | "slug">,
): PublicArticleSummary {
  return {
    title: overrides.slug,
    language: "tr",
    translationKey: null,
    summary: "Özet",
    categories: [],
    featuredImage: null,
    featured: false,
    articleType: "article",
    district: null,
    districtNeighborhood: null,
    newsCategory: null,
    externalSource: null,
    publishedAt: "2026-05-01T09:00:00.000Z",
    createdAt: "2026-05-01T09:00:00.000Z",
    updatedAt: "2026-05-02T09:00:00.000Z",
    seo: { title: "T", description: "D", index: true, follow: true },
    ...overrides,
  };
}

function bookReview(
  overrides: Partial<BookReview> = {},
): PublicBookReviewSummary {
  return toPublicBookReviewSummary({
    id: "b1",
    title: "Ultra Öğrenme",
    slug: "ultra-ogrenme",
    language: "tr",
    translationGroupId: null,
    translationStatus: "none",
    originalTitle: null,
    authors: [],
    translator: null,
    publisher: null,
    originalPublisher: null,
    publicationYear: null,
    originalPublicationYear: null,
    edition: null,
    isbn10: null,
    isbn13: null,
    pageCount: null,
    coverImage: null,
    category: null,
    tags: [],
    readingStatus: "completed",
    reviewStatus: "published",
    startedAt: null,
    completedAt: null,
    summary: "Kitap özeti",
    keyIdeas: [],
    strengths: [],
    weaknesses: [],
    whoShouldRead: [],
    whoShouldNotRead: [],
    applicationNotes: [],
    personalEvaluation: "",
    rating: null,
    quotes: [],
    relatedBookIds: [],
    authorId: null,
    editorId: null,
    featured: false,
    showOnHomepage: false,
    seo: { title: "T", description: "D", index: true, follow: true },
    createdAt: "2026-04-01T09:00:00.000Z",
    updatedAt: "2026-04-01T09:00:00.000Z",
    publishedAt: "2026-04-01T09:00:00.000Z",
    ...overrides,
  });
}

function photo(overrides: Partial<PublicPhoto> = {}): PublicPhoto {
  return {
    id: "p1",
    language: "tr",
    title: "Galata",
    slug: "galata",
    description: null,
    image: { src: "/api/media/file/galata.jpg", alt: "Galata" },
    collections: [],
    tags: [],
    takenAt: null,
    locationName: null,
    district: null,
    neighborhood: null,
    districtPhotoCategory: null,
    dayPeriod: null,
    photographer: "Şaban Durali",
    creditLicense: null,
    exif: {
      camera: null,
      lens: null,
      focalLength: null,
      aperture: null,
      shutterSpeed: null,
      iso: null,
    },
    featured: false,
    publishedAt: "2026-06-01T21:30:00.000Z",
    createdAt: "2026-06-01T21:30:00.000Z",
    updatedAt: "2026-06-03T09:00:00.000Z",
    seo: { title: "T", description: "Galata fotoğrafı", openGraphImage: null },
    ...overrides,
  };
}

const content = {
  articles: [
    article({ id: "a1", slug: "konut", title: "Konut & <kira>" }),
    article({
      id: "a2",
      slug: "gizli",
      seo: { title: "T", description: "D", index: false, follow: true },
    }),
    article({
      id: "a3",
      slug: "baska",
      seo: {
        title: "T",
        description: "D",
        index: true,
        follow: true,
        canonical: "https://example.com/asil",
      },
    }),
    article({
      id: "a4",
      slug: "konuk",
      author: "Konuk Yazar",
      publishedAt: "2026-07-01T09:00:00.000Z",
      updatedAt: "2026-07-01T09:00:00.000Z",
    }),
    article({ id: "a5", slug: "english", language: "en" }),
  ],
  bookReviews: [bookReview()],
  photos: [photo(), photo({ id: "p2", slug: "galata-en", language: "en" })],
};

test("FEEDS: dates are RFC 3339 in Europe/Istanbul", () => {
  assert.equal(
    toIstanbulRfc3339(new Date("2026-06-01T21:30:00.000Z")),
    "2026-06-02T00:30:00+03:00",
  );
  assert.equal(
    toIstanbulRfc3339(new Date("2026-01-15T09:00:00.000Z")),
    "2026-01-15T12:00:00+03:00",
  );
});

test("FEEDS: text is XML-escaped and invalid characters are dropped", () => {
  assert.equal(
    escapeXml(`a & b < c > "d" 'e'\u0001`),
    "a &amp; b &lt; c &gt; &quot;d&quot; &apos;e&apos;",
  );
});

test("FEEDS: only indexable, self-canonical items of the language, newest first", () => {
  const entries = collectFeedEntries("tr", content);
  assert.deepEqual(
    entries.map((entry) => [entry.kind, entry.path]),
    [
      ["article", "/makaleler/konuk"],
      ["photo", "/fotograflar/galata"],
      ["article", "/makaleler/konut"],
      ["book-review", "/kitaplar/ultra-ogrenme"],
    ],
  );
  assert.equal(entries[0]?.author, "Konuk Yazar");
  assert.equal(entries[2]?.author, null);
  // A photo without a caption uses its SEO description.
  assert.equal(entries[1]?.summary, "Galata fotoğrafı");
  assert.deepEqual(
    collectFeedEntries("en", content).map((entry) => entry.path),
    ["/en/photography/galata-en", "/en/articles/english"],
  );
});

test("FEEDS: a feed holds at most the newest entries", () => {
  const many = Array.from({ length: feedEntryLimit + 5 }, (_, index) =>
    article({
      id: `m${index}`,
      slug: `yazi-${index}`,
      publishedAt: new Date(Date.UTC(2026, 0, 1 + index)).toISOString(),
    }),
  );
  const entries = collectFeedEntries("tr", {
    articles: many,
    bookReviews: [],
    photos: [],
  });
  assert.equal(entries.length, feedEntryLimit);
  assert.equal(entries[0]?.path, `/makaleler/yazi-${feedEntryLimit + 4}`);
});

test("FEEDS: the Atom document carries ids, links, dates and escaped text", () => {
  const xml = buildAtomFeed(
    "tr",
    collectFeedEntries("tr", content),
    new Date("2026-10-01T00:00:00Z"),
  );
  assert.match(xml, /^<\?xml version="1.0" encoding="utf-8"\?>\n<feed /);
  assert.match(xml, /xmlns="http:\/\/www.w3.org\/2005\/Atom" xml:lang="tr-TR"/);
  assert.match(xml, new RegExp(`<id>${site}/feed.xml</id>`));
  assert.match(
    xml,
    new RegExp(
      `<link rel="self" type="application/atom\\+xml" href="${site}/feed.xml"/>`,
    ),
  );
  // The feed is as new as its newest entry, not the build time.
  assert.match(xml, /<feed[^]*?<updated>2026-07-01T12:00:00\+03:00<\/updated>/);
  assert.match(xml, /<title>Konut &amp; &lt;kira&gt;<\/title>/);
  assert.doesNotMatch(xml, /<kira>/);
  assert.match(
    xml,
    /<published>2026-05-01T12:00:00\+03:00<\/published>\n {4}<updated>2026-05-02T12:00:00\+03:00<\/updated>/,
  );
  assert.match(xml, /<author><name>Konuk Yazar<\/name><\/author>/);
  assert.match(xml, /<category term="book-review" label="Kitap incelemesi"\/>/);
  assert.doesNotMatch(xml, /gizli|example\.com/);
  assert.equal(xml.match(/<entry>/g)?.length, 4);
});

test("FEEDS: an empty feed is valid and dated by the fallback", () => {
  const xml = buildAtomFeed("en", [], new Date("2026-10-01T00:00:00Z"));
  assert.match(xml, /<updated>2026-10-01T03:00:00\+03:00<\/updated>/);
  assert.doesNotMatch(xml, /<entry>/);
  assert.match(xml, /xml:lang="en"/);
  assert.match(xml, new RegExp(`<id>${site}/en/feed.xml</id>`));
});

test("FEEDS: home and list pages announce the feed of their language", () => {
  for (const [locale, path] of [
    ["tr", "/"],
    ["en", "/en"],
  ] as const) {
    const metadata = createPageMetadata({
      title: "T",
      description: "D",
      locale,
      path,
    });
    assert.deepEqual(metadata.alternates?.types, {
      "application/atom+xml": [
        { url: `${site}${feedPaths[locale]}`, title: feedLinks[locale].title },
      ],
    });
  }
  const detail = createPageMetadata({
    title: "T",
    description: "D",
    locale: "tr",
    path: "/iletisim",
  });
  assert.equal(detail.alternates?.types, undefined);
});

test("FEEDS: both feed routes exist and regenerate like the sitemap", () => {
  for (const file of [
    "src/app/(tr)/feed.xml/route.ts",
    "src/app/(en)/en/feed.xml/route.ts",
  ]) {
    assert.ok(existsSync(file), file);
    assert.match(readFileSync(file, "utf8"), /export const revalidate = 3600;/);
  }
});
