import assert from "node:assert/strict";
import test from "node:test";
import { exampleEnglishBookReview, exampleTurkishBookReview } from "./examples";
import {
  createStaticBookReviewFixtures,
  findStaticBookReviewTranslation,
  findStaticPublishedBookReview,
  isPubliclyPublishedBookReview,
  listStaticPublishedBookReviews,
} from "./static-book-reviews";

const now = new Date("2026-10-28T12:00:00Z");

test("model reviews stay private outside development", () => {
  for (const environment of ["production", "test", undefined]) {
    const fixtures = createStaticBookReviewFixtures(environment);

    assert.equal(fixtures.length, 2);
    assert.deepEqual(listStaticPublishedBookReviews(fixtures, "tr", now), []);
    assert.deepEqual(listStaticPublishedBookReviews(fixtures, "en", now), []);
  }
});

test("development publishes clones and keeps draft, future and noindex guards private", () => {
  const fixtures = createStaticBookReviewFixtures("development");
  const turkish = listStaticPublishedBookReviews(fixtures, "tr", now);

  assert.deepEqual(
    turkish.map((review) => review.id),
    [exampleTurkishBookReview.id],
  );
  for (const slug of [
    "development-draft-book-review",
    "development-future-book-review",
    "development-noindex-book-review",
  ]) {
    assert.equal(
      findStaticPublishedBookReview(fixtures, slug, "tr", now),
      null,
    );
  }
  // The source fixtures are never mutated by the development clones.
  assert.notEqual(exampleTurkishBookReview.reviewStatus, "published");
});

test("translations follow the translation group and publication rules", () => {
  const fixtures = createStaticBookReviewFixtures("development");
  const review = findStaticPublishedBookReview(
    fixtures,
    exampleTurkishBookReview.slug,
    "tr",
    now,
  );

  assert.ok(review);
  assert.equal(
    findStaticBookReviewTranslation(fixtures, review, "en", now)?.id,
    exampleEnglishBookReview.id,
  );
  assert.equal(
    findStaticBookReviewTranslation(
      fixtures.filter((candidate) => candidate.language === "tr"),
      review,
      "en",
      now,
    ),
    null,
  );
});

test("visibility requires published status, index and a past date", () => {
  const published = {
    ...exampleTurkishBookReview,
    reviewStatus: "published" as const,
    seo: { ...exampleTurkishBookReview.seo, index: true },
    publishedAt: "2026-07-22T09:00:00+03:00",
  };

  assert.equal(isPubliclyPublishedBookReview(published, now), true);
  assert.equal(
    isPubliclyPublishedBookReview(
      { ...published, seo: { ...published.seo, index: false } },
      now,
    ),
    false,
  );
  assert.equal(
    isPubliclyPublishedBookReview(
      { ...published, publishedAt: "2099-01-01T00:00:00Z" },
      now,
    ),
    false,
  );
  assert.equal(
    isPubliclyPublishedBookReview({ ...published, publishedAt: null }, now),
    false,
  );
});
