import assert from "node:assert/strict";
import { register } from "node:module";
import test from "node:test";
import { PRIVATE_BOOK_REVIEW_FIELDS } from "./public-types";

// `server-only` is resolved by Next and is not installed as a package; the
// data source imports it, so it is an empty module outside Next.
register(
  "data:text/javascript," +
    encodeURIComponent(
      'export async function resolve(specifier, context, next) { if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true }; return next(specifier, context); }',
    ),
);

// The development fixtures are published, so the static list is not empty.
Object.assign(process.env, {
  NODE_ENV: "development",
  BOOK_PUBLIC_SOURCE: "static",
});
const { getAllPublishedBookReviews } = await import("./book-data-source");

test("ARCHITECTURE-3: the list path returns public reviews only", async () => {
  for (const language of ["tr", "en"] as const) {
    const reviews = await getAllPublishedBookReviews(language);
    assert.ok(reviews.length > 0, language);
    for (const review of reviews) {
      for (const field of PRIVATE_BOOK_REVIEW_FIELDS) {
        assert.equal(field in review, false, `${review.slug}: ${field}`);
      }
    }
  }
});
