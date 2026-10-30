import assert from "node:assert/strict";
import test from "node:test";
import { exampleEnglishBookReview, exampleTurkishBookReview } from "./examples";
import {
  BOOK_REVIEW_DETAIL_FIELDS,
  PRIVATE_BOOK_REVIEW_FIELDS,
  toPublicBookReview,
  toPublicBookReviewSummary,
} from "./public-types";

test("the public review drops every editorial field at runtime", () => {
  for (const review of [exampleTurkishBookReview, exampleEnglishBookReview]) {
    const projected = toPublicBookReview(review);
    const serialized = JSON.stringify(projected);

    for (const field of PRIVATE_BOOK_REVIEW_FIELDS) {
      assert.equal(field in projected, false, field);
    }
    assert.equal(serialized.includes("author-saban-durali"), false);
  }
});

test("every other field of the model reaches the public review", () => {
  const privateFields = new Set<string>(PRIVATE_BOOK_REVIEW_FIELDS);
  const projected = toPublicBookReview(exampleEnglishBookReview);

  for (const [field, value] of Object.entries(exampleEnglishBookReview)) {
    if (privateFields.has(field)) continue;
    assert.deepEqual(
      (projected as Record<string, unknown>)[field],
      value,
      field,
    );
  }
  assert.equal(
    projected.translationSourceBookReviewId,
    exampleTurkishBookReview.id,
  );
  assert.equal(
    "translationSourceBookReviewId" in
      toPublicBookReview(exampleTurkishBookReview),
    false,
  );
});

test("SEO-PERF-6: the list summary is the public review without the detail fields", () => {
  const hidden = new Set<string>([
    ...PRIVATE_BOOK_REVIEW_FIELDS,
    ...BOOK_REVIEW_DETAIL_FIELDS,
  ]);
  for (const review of [exampleTurkishBookReview, exampleEnglishBookReview]) {
    const summary = toPublicBookReviewSummary(review);
    for (const field of hidden) {
      assert.equal(field in summary, false, field);
    }
    for (const [field, value] of Object.entries(review)) {
      if (hidden.has(field)) continue;
      assert.deepEqual(
        (summary as Record<string, unknown>)[field],
        value,
        field,
      );
    }
    // The public review projects to the same summary.
    assert.deepEqual(
      toPublicBookReviewSummary(toPublicBookReview(review)),
      summary,
    );
  }
});
