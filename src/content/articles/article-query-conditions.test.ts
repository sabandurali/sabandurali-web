import assert from "node:assert/strict";
import test from "node:test";
import { createPublicArticleConditions } from "./article-query-conditions";

const now = new Date("2026-10-28T12:00:00Z");
const published = [
  { _status: { equals: "published" } },
  { publishedAt: { less_than_equal: "2026-10-28T12:00:00.000Z" } },
];

test("standalone reads (lists, slug and translation lookups) exclude district news", () => {
  assert.deepEqual(createPublicArticleConditions(now, { kind: "standalone" }), [
    ...published,
    { articleType: { not_equals: "district-news" } },
  ]);
});

test("category pages filter by category slug in the database", () => {
  assert.deepEqual(
    createPublicArticleConditions(now, {
      kind: "category",
      categorySlug: "sehir",
    }),
    [
      ...published,
      { articleType: { not_equals: "district-news" } },
      { "categories.slug": { equals: "sehir" } },
    ],
  );
});

test("district pages filter by article type and district in the database", () => {
  assert.deepEqual(
    createPublicArticleConditions(now, {
      kind: "district",
      articleType: "district-research",
      district: "kadikoy",
    }),
    [
      ...published,
      { articleType: { equals: "district-research" } },
      { district: { equals: "kadikoy" } },
    ],
  );
});
