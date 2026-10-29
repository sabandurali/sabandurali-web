import assert from "node:assert/strict";
import test from "node:test";
import { exampleEnglishArticle } from "@/content/articles/examples";
import { mapStaticArticle } from "@/content/articles/static-articles";
import { getArticleMetaItems } from "./article-meta";

test("a scheduled article shows no update line before its publication", () => {
  // Saved on 1 October, scheduled for 10 October.
  const items = getArticleMetaItems(
    mapStaticArticle({
      ...exampleEnglishArticle,
      publishedAt: "2026-10-10T09:00:00.000Z",
      updatedAt: "2026-10-01T09:00:00.000Z",
    }),
  );

  assert.equal(items[0]?.value, "10 October 2026");
  assert.equal(
    items.some((item) => item.label === "Updated"),
    false,
  );
});

test("an edit after publication is shown with its machine value", () => {
  const updated = getArticleMetaItems(
    mapStaticArticle({
      ...exampleEnglishArticle,
      publishedAt: "2026-10-10T09:00:00.000Z",
      updatedAt: "2026-10-20T09:00:00.000Z",
    }),
  ).find((item) => item.label === "Updated");

  assert.equal(updated?.value, "20 October 2026");
  assert.equal(updated?.dateTime, "2026-10-20T09:00:00.000Z");
});
