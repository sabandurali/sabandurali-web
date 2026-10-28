import assert from "node:assert/strict";
import test from "node:test";
import {
  exampleDraftArticle,
  exampleEnglishArticle,
  exampleTurkishArticle,
} from "./examples";
import {
  findStaticArticleTranslation,
  findStaticPublishedArticle,
  isPubliclyPublishedStaticArticle,
  listStaticPublishedArticles,
  mapStaticArticle,
} from "./static-articles";
import type { Article } from "./types";

const now = new Date("2026-10-28T12:00:00Z");
const fixtures: ReadonlyArray<Article> = [
  exampleTurkishArticle,
  exampleEnglishArticle,
  exampleDraftArticle,
];

test("only published, public and already published fixtures are visible", () => {
  assert.equal(
    isPubliclyPublishedStaticArticle(exampleTurkishArticle, now),
    true,
  );
  assert.equal(
    isPubliclyPublishedStaticArticle(exampleDraftArticle, now),
    false,
  );
  assert.equal(
    isPubliclyPublishedStaticArticle(
      { ...exampleTurkishArticle, visibility: "unlisted" },
      now,
    ),
    false,
  );
  assert.equal(
    isPubliclyPublishedStaticArticle(
      { ...exampleTurkishArticle, publishedAt: "2099-01-01T00:00:00Z" },
      now,
    ),
    false,
  );
  assert.equal(
    isPubliclyPublishedStaticArticle(
      { ...exampleTurkishArticle, publishedAt: "not a date" },
      now,
    ),
    false,
  );
});

test("lists are per language, newest first and never include drafts", () => {
  const newer: Article = {
    ...exampleTurkishArticle,
    id: "newer",
    slug: "newer",
    publishedAt: "2026-08-01T09:00:00+03:00",
  };
  const turkish = listStaticPublishedArticles([...fixtures, newer], "tr", now);

  assert.deepEqual(
    turkish.map((article) => article.id),
    ["newer", exampleTurkishArticle.id],
  );
  assert.deepEqual(
    listStaticPublishedArticles(fixtures, "en", now).map(
      (article) => article.id,
    ),
    [exampleEnglishArticle.id],
  );
});

test("slug lookups and translations respect language and publication", () => {
  assert.equal(
    findStaticPublishedArticle(fixtures, exampleTurkishArticle.slug, "en", now),
    null,
  );
  assert.equal(
    findStaticPublishedArticle(fixtures, exampleDraftArticle.slug, "tr", now),
    null,
  );

  const article = findStaticPublishedArticle(
    fixtures,
    exampleTurkishArticle.slug,
    "tr",
    now,
  );
  assert.ok(article);
  assert.equal(
    findStaticArticleTranslation(fixtures, article, "en", now)?.id,
    exampleEnglishArticle.id,
  );
  assert.equal(
    findStaticArticleTranslation(
      [exampleTurkishArticle, { ...exampleEnglishArticle, status: "draft" }],
      article,
      "en",
      now,
    ),
    null,
  );
  assert.equal(
    findStaticArticleTranslation(fixtures, exampleDraftArticle, "en", now),
    null,
  );
});

test("static articles map to the public article shape", () => {
  const mapped = mapStaticArticle(exampleTurkishArticle);

  assert.equal(mapped.articleType, "article");
  assert.equal(mapped.translationKey, exampleTurkishArticle.translationGroupId);
  assert.deepEqual(mapped.categories, [
    {
      id: "real_estate",
      name: "Gayrimenkul",
      slug: "real_estate",
      sortOrder: 0,
    },
  ]);
  assert.equal(mapped.featuredImage?.source, "static");
  assert.equal(mapped.content.source, "static");
  assert.throws(() => mapStaticArticle(exampleDraftArticle), /publishedAt/);
});
