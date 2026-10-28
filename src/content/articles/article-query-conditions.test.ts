import assert from "node:assert/strict";
import test from "node:test";
import { createPublicArticleConditions } from "./article-query-conditions";

const now = new Date("2026-10-28T12:00:00Z");
const translated = [
  { title: { exists: true } },
  { slug: { exists: true } },
  { excerpt: { exists: true } },
];
const published = [
  { _status: { equals: "published" } },
  { publishedAt: { less_than_equal: "2026-10-28T12:00:00.000Z" } },
  ...translated,
];

test("every read skips articles without a translation in the query locale", () => {
  for (const filter of [
    { kind: "standalone" },
    { kind: "category", categorySlug: "sehir" },
    { kind: "district", articleType: "district-news", district: "kadikoy" },
  ] as const) {
    const conditions = createPublicArticleConditions(now, filter);

    for (const condition of translated) {
      assert.ok(
        conditions.some(
          (item) => JSON.stringify(item) === JSON.stringify(condition),
        ),
        `${filter.kind}: ${JSON.stringify(condition)}`,
      );
    }
  }
});

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
