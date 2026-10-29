import assert from "node:assert/strict";
import test from "node:test";
import { exampleEnglishBookReview, exampleTurkishBookReview } from "./examples";
import { PRIVATE_BOOK_REVIEW_FIELDS, toPublicBookReview } from "./public-types";

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
