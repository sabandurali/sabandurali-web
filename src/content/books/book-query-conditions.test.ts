import assert from "node:assert/strict";
import test from "node:test";
import { createPublicBookReviewConditions } from "./book-query-conditions";

test("public book reviews are published, approved, indexable and not scheduled", () => {
  assert.deepEqual(
    createPublicBookReviewConditions(new Date("2026-10-28T12:00:00Z")),
    [
      { _status: { equals: "published" } },
      { reviewStatus: { equals: "published" } },
      { publishedAt: { less_than_equal: "2026-10-28T12:00:00.000Z" } },
      { "seo.index": { equals: true } },
    ],
  );
});
