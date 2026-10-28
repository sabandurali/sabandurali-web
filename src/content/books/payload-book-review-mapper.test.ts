import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import type { Book as PayloadBook } from "../../payload-types";
import { mediaDocument } from "../rich-text/lexical-fixtures";
import { mapPayloadBookReview } from "./payload-book-review-mapper";

const now = new Date("2026-10-28T12:00:00Z");

// Loose overrides and a cast keep the fixture compiling when the schema grows.
function book(overrides: Record<string, unknown> = {}): PayloadBook {
  return {
    id: "book-1",
    title: "Derin Çalışma",
    slug: "derin-calisma",
    language: "tr",
    authors: [{ id: "a1", name: "Cal Newport", slug: "cal-newport" }],
    coverImage: mediaDocument,
    coverImageAlt: "Derin Çalışma kitabının kapağı",
    category: "personal_development",
    readingStatus: "completed",
    reviewStatus: "published",
    translationStatus: "none",
    startedAt: "2026-08-01T00:00:00Z",
    completedAt: "2026-09-01T00:00:00Z",
    summary: "Kitabın kısa özeti.",
    keyIdeas: [
      { id: "k1", title: "Odak", description: "Odak bir beceridir.", order: 1 },
    ],
    strengths: [{ value: "Uygulanabilir" }],
    weaknesses: [{ value: "Tekrarlar" }],
    whoShouldRead: [{ value: "Bilgi çalışanları" }],
    whoShouldNotRead: [],
    applicationNotes: [
      {
        id: "n1",
        title: "Blok",
        description: "Takvimde blok",
        action: "Her sabah 90 dakika",
        order: 1,
      },
    ],
    personalEvaluation: "Kişisel değerlendirme.",
    rating: 8,
    quotes: [],
    featured: false,
    showOnHomepage: false,
    seo: {
      title: "Derin Çalışma incelemesi",
      description: "Derin Çalışma kitabı üzerine kişisel inceleme.",
      index: true,
      follow: true,
    },
    publishedAt: "2026-10-01T09:00:00Z",
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-10-01T09:00:00Z",
    _status: "published",
    ...overrides,
  } as PayloadBook;
}

function silence(t: TestContext) {
  return t.mock.method(console, "warn", () => {});
}

test("a complete published review maps with its cover credit", (t) => {
  silence(t);
  const review = mapPayloadBookReview(book(), now);

  assert.ok(review);
  assert.equal(review.translationGroupId, null);
  assert.deepEqual(review.coverImage, {
    src: mediaDocument.url,
    alt: "Derin Çalışma kitabının kapağı",
    caption: mediaDocument.description,
    source: mediaDocument.sourceCopyright,
    copyrightOwner: mediaDocument.sourceCopyright,
    credit: mediaDocument.sourceCopyright,
    width: 1600,
    height: 900,
  });
});

test("an English review keeps the credit but not the Turkish caption", (t) => {
  silence(t);
  const review = mapPayloadBookReview(
    book({ language: "en", slug: "deep-work" }),
    now,
  );

  assert.equal(review?.coverImage?.credit, mediaDocument.sourceCopyright);
  assert.equal(review?.coverImage?.caption, undefined);
});

test("reviews that the public schema rejects are skipped and logged", (t) => {
  const warn = silence(t);

  for (const overrides of [
    { reviewStatus: "draft" },
    { seo: { title: "x", description: "y", index: false } },
    { publishedAt: "2026-12-01T00:00:00Z" },
    { coverImage: null },
    { coverImage: { ...mediaDocument, mimeType: "application/pdf" } },
    { authors: [] },
    { rating: null },
    { readingStatus: "completed", completedAt: null },
    { personalEvaluation: "  " },
  ]) {
    assert.equal(mapPayloadBookReview(book(overrides), now), null);
  }

  assert.equal(warn.mock.callCount(), 9);
  assert.ok(
    warn.mock.calls.every((call) =>
      /"scope":"books","id":"book-1"/.test(String(call.arguments[0])),
    ),
  );
});

test("translations share one group id from either side of the relation", (t) => {
  silence(t);
  const turkish = mapPayloadBookReview(book({ translation: "book-2" }), now);
  const english = mapPayloadBookReview(
    book({ id: "book-2", language: "en", slug: "deep-work" }),
    now,
    "book-1",
  );

  assert.equal(turkish?.translationSourceBookReviewId, "book-2");
  assert.ok(turkish?.translationGroupId);
  assert.equal(english?.translationGroupId, turkish?.translationGroupId);
});
