import assert from "node:assert/strict";
import test from "node:test";
import {
  articlePageContent,
  formatArticleDate,
} from "./articles/article-page-content";
import {
  bookPageContent,
  formatBookReviewDate,
} from "./books/book-page-content";

// 21:30 UTC is 00:30 on the next day in Istanbul.
const lateEvening = "2026-03-31T21:30:00Z";

test("article dates use the shared Istanbul formatter", () => {
  assert.equal(
    formatArticleDate(lateEvening, articlePageContent.tr),
    "1 Nisan 2026",
  );
  assert.equal(
    formatArticleDate(lateEvening, articlePageContent.en),
    "1 April 2026",
  );
  assert.equal(formatArticleDate(null, articlePageContent.tr), null);
  assert.equal(formatArticleDate("invalid", articlePageContent.tr), null);
});

test("book review dates use the shared Istanbul formatter", () => {
  assert.equal(
    formatBookReviewDate(lateEvening, bookPageContent.tr),
    "1 Nisan 2026",
  );
  assert.equal(
    formatBookReviewDate(lateEvening, bookPageContent.en),
    "1 April 2026",
  );
  assert.equal(formatBookReviewDate(undefined, bookPageContent.en), null);
});
