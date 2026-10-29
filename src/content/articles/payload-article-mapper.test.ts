import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import type { Article as PayloadArticle } from "../../payload-types";
import {
  heading,
  lexical,
  link,
  mediaDocument,
  paragraph,
  text,
} from "../rich-text/lexical-fixtures";
import {
  mapPayloadArticle,
  toPublicArticleSummary,
  toPublicArticleTranslation,
} from "./payload-article-mapper";

const now = new Date("2026-10-28T12:00:00Z");

// Loose overrides and a cast keep the fixture compiling when the schema gains
// fields; the mapper treats every value as untrusted anyway.
function article(overrides: Record<string, unknown> = {}): PayloadArticle {
  return {
    id: "article-1",
    title: "Kadıköy’de yaşam",
    slug: "kadikoyde-yasam",
    excerpt: "Kadıköy hakkında kaynaklı bir özet.",
    content: lexical(heading("h2", "Giriş"), paragraph(text("Gövde metni."))),
    categories: [
      {
        id: "c2",
        name: "Şehir",
        slug: "sehir",
        sortOrder: 2,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "c1",
        name: "Araştırma",
        slug: "arastirma",
        sortOrder: 1,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      "unpopulated-category",
    ],
    featuredImage: mediaDocument,
    featuredImageAlt: "Bu makaledeki bağlamıyla rıhtım",
    articleType: "article",
    publishedAt: "2026-10-01T09:00:00Z",
    createdAt: "2026-09-01T09:00:00Z",
    updatedAt: "2026-10-02T09:00:00Z",
    _status: "published",
    ...overrides,
  } as PayloadArticle;
}

function silence(t: TestContext) {
  return t.mock.method(console, "warn", () => {});
}

test("a complete published article maps to the public shape", (t) => {
  silence(t);
  const mapped = mapPayloadArticle(article(), "tr", now);

  assert.ok(mapped);
  assert.equal(mapped.language, "tr");
  assert.equal(mapped.translationKey, "article-1");
  assert.deepEqual(
    mapped.categories.map((category) => category.slug),
    ["arastirma", "sehir"],
  );
  assert.deepEqual(mapped.featuredImage, {
    source: "payload",
    src: mediaDocument.url,
    alt: "Bu makaledeki bağlamıyla rıhtım",
    caption: mediaDocument.description,
    credit: mediaDocument.sourceCopyright,
    width: 1600,
    height: 900,
  });
  assert.equal(mapped.seo.title, "Kadıköy’de yaşam");
  assert.equal(mapped.seo.openGraphImage, mediaDocument.url);
  assert.equal(toPublicArticleSummary(mapped).summary, mapped.summary);
  assert.deepEqual(toPublicArticleTranslation(mapped), {
    id: "article-1",
    language: "tr",
    slug: "kadikoyde-yasam",
    title: "Kadıköy’de yaşam",
  });
});

test("English images keep the credit but not the Turkish caption", (t) => {
  silence(t);
  const mapped = mapPayloadArticle(article(), "en", now);

  assert.equal(mapped?.featuredImage?.credit, mediaDocument.sourceCopyright);
  assert.equal(mapped?.featuredImage?.caption, undefined);
});

test("drafts, scheduled articles and missing locale fields are skipped and logged", (t) => {
  const warn = silence(t);

  for (const overrides of [
    { _status: "draft" as const },
    { publishedAt: "2026-11-01T00:00:00Z" },
    { publishedAt: null },
    { title: "  " },
    { excerpt: "" },
    { content: null },
    { content: lexical(paragraph(text("   "))) },
  ]) {
    assert.equal(mapPayloadArticle(article(overrides), "en", now), null);
  }

  assert.equal(warn.mock.callCount(), 7);
  for (const call of warn.mock.calls) {
    const line = String(call.arguments[0]);
    assert.match(line, /"scope":"articles"/);
    assert.match(line, /"id":"article-1"/);
    assert.equal(line.includes("Gövde metni"), false);
  }
});

test("district news needs its original source and carries no body", (t) => {
  silence(t);
  const newsFields = {
    articleType: "district-news",
    district: "kadikoy",
    content: null,
    externalSource: {
      name: "Kadıköy Belediyesi",
      url: "https://kadikoy.bel.tr/haber",
      checkedAt: "2026-10-01T00:00:00Z",
    },
  };
  const news = article(newsFields);

  const mapped = mapPayloadArticle(news, "tr", now);
  assert.equal(mapped?.content.source, "lexical");
  assert.equal(
    mapped?.content.source === "lexical" ? mapped.content.data : "x",
    null,
  );
  assert.equal(mapped?.externalSource?.name, "Kadıköy Belediyesi");
  assert.equal(
    mapPayloadArticle(
      article({ ...newsFields, externalSource: null }),
      "tr",
      now,
    ),
    null,
  );
});

test("PDF or foreign media never becomes a featured image", (t) => {
  silence(t);
  for (const featuredImage of [
    { ...mediaDocument, mimeType: "application/pdf" },
    { ...mediaDocument, url: "https://evil.example/x.jpg" },
    "media-1",
  ]) {
    const mapped = mapPayloadArticle(article({ featuredImage }), "tr", now);
    assert.equal(mapped?.featuredImage, null);
    assert.equal(mapped?.seo.openGraphImage, undefined);
  }
});

test("internal links in the body are resolved for the requested locale", (t) => {
  silence(t);
  const target = {
    relationTo: "articles",
    value: {
      id: "article-2",
      slug: "moda-sahili",
      _status: "published",
      publishedAt: "2026-09-01T00:00:00Z",
    },
  };
  const mapped = mapPayloadArticle(
    article({
      content: lexical(
        paragraph(link({ linkType: "internal", newTab: false, doc: target })),
      ),
    }),
    "en",
    now,
  );
  const serialized = JSON.stringify(
    mapped?.content.source === "lexical" ? mapped.content.data : null,
  );

  assert.ok(serialized.includes('"url":"/en/articles/moda-sahili"'));
  assert.ok(serialized.includes('"linkType":"custom"'));
});

test("SEO controls and a guest author reach the public article", (t) => {
  silence(t);
  const mapped = mapPayloadArticle(
    article({
      author: { name: "Konuk Yazar" },
      seo: {
        canonical: "/makaleler/ozgun-makale",
        index: false,
        follow: false,
      },
    }),
    "tr",
    now,
  );

  assert.ok(mapped);
  assert.equal(mapped.author, "Konuk Yazar");
  assert.equal(mapped.seo.canonical, "/makaleler/ozgun-makale");
  assert.equal(mapped.seo.index, false);
  assert.equal(mapped.seo.follow, false);
  assert.equal(toPublicArticleSummary(mapped).author, "Konuk Yazar");
});

test("the owner, blank authors and foreign canonicals fall back to defaults", (t) => {
  silence(t);
  for (const name of ["Şaban Durali", "  ", null]) {
    const mapped = mapPayloadArticle(
      article({
        author: { name },
        seo: { canonical: "https://example.com/kopya" },
      }),
      "tr",
      now,
    );

    assert.ok(mapped);
    assert.equal("author" in mapped, false, String(name));
    assert.equal(mapped.seo.canonical, undefined);
    assert.equal(mapped.seo.index, true);
    assert.equal(mapped.seo.follow, true);
  }
});
