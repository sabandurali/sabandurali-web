import assert from "node:assert/strict";
import test from "node:test";
import {
  getBookPublicationIssues,
  isPublishableCoverImage,
  toBookReviewCandidate,
} from "./bookPublication";

const cover = {
  alt: "Kitap kapağı",
  height: 1200,
  id: "media-1",
  mimeType: "image/jpeg",
  url: "/api/media/file/kapak.jpg",
  width: 800,
};

/** A review that the public site shows. */
function publishableBook(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    _status: "published",
    authors: [{ id: "author-1", name: "Cal Newport", slug: "cal-newport" }],
    category: "personal_development",
    completedAt: "2026-09-01T00:00:00.000Z",
    coverImage: "media-1",
    id: "book-1",
    isbn13: "9780306406157",
    language: "tr",
    personalEvaluation: "Odaklanmayı öğreten güçlü bir kitap.",
    publishedAt: "2026-10-01T00:00:00.000Z",
    rating: 8.5,
    readingStatus: "completed",
    reviewStatus: "published",
    seo: {
      description: "Derin Çalışma kitabı üzerine kişisel inceleme ve notlar.",
      follow: true,
      index: true,
      title: "Derin Çalışma incelemesi",
    },
    slug: "derin-calisma",
    startedAt: "2026-08-01T00:00:00.000Z",
    summary: "Odaklanma üzerine bir kitap.",
    title: "Derin Çalışma",
    translationStatus: "none",
    ...overrides,
  };
}

function issuePaths(book: Record<string, unknown>, media: unknown = cover) {
  return getBookPublicationIssues(book, media).map((issue) => issue.path);
}

test("a complete review publishes without issues", () => {
  assert.deepEqual(getBookPublicationIssues(publishableBook(), cover), []);
});

test("drafts and archived reviews are never blocked", () => {
  assert.deepEqual(
    getBookPublicationIssues(
      publishableBook({ _status: "draft", rating: null, summary: "" }),
      null,
    ),
    [],
  );
  assert.deepEqual(
    getBookPublicationIssues(
      publishableBook({ reviewStatus: "archived", seo: { index: false } }),
      null,
    ),
    [],
  );
});

test("publishing needs reviewStatus published (or archived to keep it hidden)", () => {
  for (const reviewStatus of ["draft", "in_review", "scheduled", undefined]) {
    const issues = getBookPublicationIssues(
      publishableBook({ reviewStatus }),
      cover,
    );
    assert.equal(issues.length, 1, String(reviewStatus));
    assert.equal(issues[0].path, "reviewStatus");
  }
});

test("a published review must allow indexing, since the site hides it otherwise", () => {
  assert.deepEqual(
    issuePaths(
      publishableBook({
        seo: {
          description: "Açıklama",
          follow: true,
          index: false,
          title: "Başlık",
        },
      }),
    ),
    ["seo.index"],
  );
});

test("every rule the public site applies is reported on its field", () => {
  const paths = issuePaths(
    publishableBook({
      authors: [],
      category: null,
      completedAt: null,
      isbn13: "9780306406158",
      publishedAt: null,
      rating: null,
    }),
  );

  for (const expected of [
    "authors",
    "category",
    "completedAt",
    "isbn13",
    "publishedAt",
    "rating",
  ]) {
    assert.ok(
      paths.includes(expected),
      `missing ${expected} in ${paths.join(", ")}`,
    );
  }

  assert.deepEqual(issuePaths(publishableBook({ rating: 11 })), ["rating"]);
  assert.deepEqual(
    issuePaths(
      publishableBook({
        completedAt: "2026-07-01T00:00:00.000Z",
        startedAt: "2026-08-01T00:00:00.000Z",
      }),
    ),
    ["completedAt"],
  );
});

test("the cover must be an image with dimensions served from a safe path", () => {
  assert.deepEqual(issuePaths(publishableBook({ coverImage: null }), null), [
    "coverImage",
  ]);

  for (const media of [
    { ...cover, mimeType: "application/pdf" },
    { ...cover, width: null },
    { ...cover, url: "/api/media/file/kapak.jpg?prefix=x" },
    null,
  ]) {
    const issues = getBookPublicationIssues(publishableBook(), media);
    assert.deepEqual(
      issues.map((issue) => issue.path),
      ["coverImage"],
    );
    assert.match(issues[0].message, /genişlik ve yükseklik/);
  }

  assert.equal(isPublishableCoverImage(cover), true);
});

test("the candidate mirrors what the public mapper builds", () => {
  const candidate = toBookReviewCandidate(
    publishableBook({ coverImageAlt: "Özel alt metin" }),
    cover,
  );

  assert.equal(candidate.coverImage?.alt, "Özel alt metin");
  assert.equal(candidate.coverImage?.width, 800);
  assert.equal(candidate.seo.index, true);
  assert.equal(candidate.category, "personal_development");
  assert.equal(
    toBookReviewCandidate(publishableBook({ category: "unknown" }), cover)
      .category,
    null,
  );
});
