import assert from "node:assert/strict";
import test from "node:test";
import {
  formatAdminDateTime,
  getPublicRecordLinks,
  getPublicRecordState,
  isPublicRecordCollection,
} from "./public-record";

const now = new Date("2026-10-30T09:00:00.000Z");
const past = "2026-10-01T09:00:00.000Z";
const future = "2026-11-12T06:30:00.000Z";

test("ADM-PUBLIC-LINKS: the badge tells live, scheduled and draft records apart", () => {
  assert.deepEqual(getPublicRecordState("articles", null, now), {
    kind: "draft",
  });
  assert.deepEqual(
    getPublicRecordState("articles", { _status: "draft" }, now),
    { kind: "draft" },
  );
  assert.deepEqual(
    getPublicRecordState(
      "articles",
      { _status: "published", publishedAt: past },
      now,
    ),
    { kind: "live", publishedAt: past },
  );
  assert.deepEqual(
    getPublicRecordState(
      "photos",
      { _status: "published", publishedAt: future },
      now,
    ),
    { kind: "scheduled", publishedAt: future },
  );
  // Published without a date: public reads filter on publishedAt <= now.
  assert.deepEqual(
    getPublicRecordState("photos", { _status: "published" }, now),
    { kind: "draft" },
  );
});

test("ADM-PUBLIC-LINKS: book reviews and English standard pages explain why they stay hidden", () => {
  const book = { _status: "published", publishedAt: past };
  const archived = getPublicRecordState(
    "books",
    { ...book, reviewStatus: "archived", seo: { index: true } },
    now,
  );
  assert.equal(archived.kind, "hidden");
  const noindex = getPublicRecordState(
    "books",
    { ...book, reviewStatus: "published", seo: { index: false } },
    now,
  );
  assert.equal(noindex.kind, "hidden");
  assert.equal(
    getPublicRecordState(
      "books",
      { ...book, reviewStatus: "published", seo: { index: true } },
      now,
    ).kind,
    "live",
  );
  assert.equal(
    getPublicRecordState(
      "pages",
      { ...book, language: "en", pageType: "standard" },
      now,
    ).kind,
    "hidden",
  );
});

test("ADM-PUBLIC-LINKS: localized records link each locale that has its public fields", () => {
  assert.deepEqual(
    getPublicRecordLinks("articles", {
      excerpt: { en: "Summary", tr: "Özet" },
      slug: { en: "metro-lines", tr: "metro-hatlari" },
      title: { en: "Metro lines", tr: "Metro hatları" },
    }),
    [
      { locale: "tr", path: "/makaleler/metro-hatlari" },
      { locale: "en", path: "/en/articles/metro-lines" },
    ],
  );
  // No English excerpt: the English lists skip the article.
  assert.deepEqual(
    getPublicRecordLinks("articles", {
      excerpt: { tr: "Özet" },
      slug: { en: "metro-lines", tr: "metro-hatlari" },
      title: { en: "Metro lines", tr: "Metro hatları" },
    }),
    [{ locale: "tr", path: "/makaleler/metro-hatlari" }],
  );
  assert.deepEqual(
    getPublicRecordLinks("articles", {
      articleType: "district-news",
      district: "sile",
      slug: { tr: "haber" },
    }),
    [{ locale: "tr", path: "/istanbul/ilceler/sile/haberler" }],
  );
  assert.deepEqual(
    getPublicRecordLinks("photos", {
      altText: { tr: "Kıyı" },
      slug: { en: "coast", tr: "kiyi" },
      title: { en: "Coast", tr: "Kıyı" },
    }),
    [{ locale: "tr", path: "/fotograflar/kiyi" }],
  );
});

test("ADM-PUBLIC-LINKS: per-language records use their own language and route", () => {
  assert.deepEqual(
    getPublicRecordLinks("books", { language: "en", slug: "deep-work" }),
    [{ locale: "en", path: "/en/books/deep-work" }],
  );
  assert.deepEqual(
    getPublicRecordLinks("pages", { language: "tr", pageType: "home" }),
    [{ locale: "tr", path: "/" }],
  );
  assert.deepEqual(
    getPublicRecordLinks("pages", { language: "en", pageType: "home" }),
    [{ locale: "en", path: "/en" }],
  );
  assert.deepEqual(
    getPublicRecordLinks("pages", {
      language: "tr",
      pageType: "standard",
      slug: "ana-sayfa",
    }),
    [{ locale: "tr", path: "/" }],
  );
  assert.deepEqual(
    getPublicRecordLinks("pages", {
      language: "en",
      pageType: "standard",
      slug: "about",
    }),
    [],
  );
  assert.deepEqual(
    getPublicRecordLinks("district-guides", { district: "sile" }),
    [{ locale: "tr", path: "/istanbul/ilceler/sile" }],
  );
  assert.deepEqual(
    getPublicRecordLinks("district-guides", { district: "atlantis" }),
    [],
  );
});

test("ADM-PUBLIC-LINKS: dates are shown in Istanbul time and collections are checked", () => {
  assert.equal(formatAdminDateTime(future), "12 Kasım 2026 09:30");
  assert.equal(formatAdminDateTime("not a date"), null);
  assert.ok(isPublicRecordCollection("articles"));
  assert.ok(!isPublicRecordCollection("media"));
});
