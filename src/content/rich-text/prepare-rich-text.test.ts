import assert from "node:assert/strict";
import test from "node:test";
import {
  heading,
  lexical,
  link,
  mediaDocument,
  paragraph,
  relationship,
  text,
  upload,
} from "./lexical-fixtures";
import { INTERNAL_LINK_COLLECTIONS } from "./internal-link-collections";
import {
  collectLinkedArticles,
  getInternalDocumentPath,
  prepareRichText,
} from "./prepare-rich-text";

const now = new Date("2026-10-28T12:00:00Z");
const past = "2026-10-01T09:00:00Z";
const future = "2026-11-01T09:00:00Z";

function internal(relationTo: string, value: unknown) {
  return { relationTo, value };
}

test("articles and photos link to the page locale", () => {
  const article = {
    id: "a1",
    slug: "kadikoy-rehberi",
    _status: "published",
    publishedAt: past,
  };

  assert.equal(
    getInternalDocumentPath(internal("articles", article), "tr", now),
    "/makaleler/kadikoy-rehberi",
  );
  assert.equal(
    getInternalDocumentPath(internal("articles", article), "en", now, {
      offeredEnglishArticleIds: new Set(["a1"]),
    }),
    "/en/articles/kadikoy-rehberi",
  );
  assert.equal(
    getInternalDocumentPath(
      internal("photos", {
        id: "p1",
        slug: "galata",
        title: "Galata",
        altText: "Galata Kulesi",
        _status: "published",
        publishedAt: past,
      }),
      "en",
      now,
    ),
    "/en/photography/galata",
  );
});

test("English article links resolve only to offered (complete) translations", () => {
  const article = {
    id: "a1",
    slug: "kadikoy-guide",
    _status: "published",
    publishedAt: past,
  };

  // No link context: the English version may be an unfinished translation
  // that the detail page refuses, so the link stays plain text.
  assert.equal(
    getInternalDocumentPath(internal("articles", article), "en", now),
    null,
  );
  assert.equal(
    getInternalDocumentPath(internal("articles", article), "en", now, {
      offeredEnglishArticleIds: new Set(["other"]),
    }),
    null,
  );
  // Turkish links never need the context.
  assert.equal(
    getInternalDocumentPath(internal("articles", article), "tr", now),
    "/makaleler/kadikoy-guide",
  );
});

test("photo links need the localized title and alt text the detail page requires", () => {
  const photo = {
    id: "p1",
    slug: "galata",
    title: "Galata",
    altText: "Galata Kulesi",
    _status: "published",
    publishedAt: past,
  };

  for (const value of [
    { ...photo, altText: null },
    { ...photo, altText: " " },
    { ...photo, title: undefined },
  ]) {
    assert.equal(
      getInternalDocumentPath(internal("photos", value), "en", now),
      null,
    );
  }
});

test("collectLinkedArticles finds populated article targets anywhere", () => {
  const articleLink = link({
    linkType: "internal",
    doc: internal("articles", { id: "a1", slug: "x", content: "EN" }),
  });
  const found = collectLinkedArticles([
    { layout: [{ content: lexical(paragraph(articleLink)) }] },
    lexical(
      paragraph(
        link({ linkType: "internal", doc: internal("articles", "a2") }),
        link({ linkType: "internal", doc: internal("photos", { id: "p" }) }),
      ),
    ),
  ]);

  assert.deepEqual([...found.entries()], [["a1", "EN"]]);
});

test("unpublished, scheduled, unpopulated and district news targets do not resolve", () => {
  const base = { id: "a1", slug: "x", _status: "published", publishedAt: past };

  for (const value of [
    { ...base, _status: "draft" },
    { ...base, publishedAt: future },
    { ...base, publishedAt: undefined },
    { ...base, slug: "  " },
    { ...base, articleType: "district-news" },
    "a1", // Payload keeps only the ID when the target is not readable.
  ]) {
    assert.equal(
      getInternalDocumentPath(internal("articles", value), "tr", now),
      null,
    );
  }
  assert.equal(getInternalDocumentPath(null, "tr", now), null);
  assert.equal(
    getInternalDocumentPath(
      internal("categories", { id: "c1", slug: "x" }),
      "tr",
      now,
    ),
    null,
  );
});

test("pages and book reviews use their own language", () => {
  const page = { id: "pg", _status: "published", publishedAt: past };

  assert.equal(
    getInternalDocumentPath(
      internal("pages", {
        ...page,
        language: "tr",
        pageType: "standard",
        slug: "hakkimda-detay",
      }),
      "en",
      now,
    ),
    "/hakkimda-detay",
  );
  assert.equal(
    getInternalDocumentPath(
      internal("pages", {
        ...page,
        language: "en",
        pageType: "home",
        slug: "home",
      }),
      "tr",
      now,
    ),
    "/en",
  );
  // English standard pages have no public route.
  assert.equal(
    getInternalDocumentPath(
      internal("pages", {
        ...page,
        language: "en",
        pageType: "standard",
        slug: "about",
      }),
      "en",
      now,
    ),
    null,
  );

  const book = {
    id: "b1",
    slug: "deep-work",
    language: "en",
    _status: "published",
    reviewStatus: "published",
    publishedAt: past,
    seo: { index: true },
  };
  assert.equal(
    getInternalDocumentPath(internal("books", book), "tr", now),
    "/en/books/deep-work",
  );
  assert.equal(
    getInternalDocumentPath(
      internal("books", { ...book, seo: { index: false } }),
      "tr",
      now,
    ),
    null,
  );
  assert.equal(
    getInternalDocumentPath(
      internal("books", { ...book, reviewStatus: "draft" }),
      "tr",
      now,
    ),
    null,
  );
});

test("district guides link to every registered district page", () => {
  assert.equal(
    getInternalDocumentPath(
      internal("district-guides", {
        id: "d",
        district: "kadikoy",
        _status: "draft",
      }),
      "tr",
      now,
    ),
    "/istanbul/ilceler/kadikoy",
  );
  assert.equal(
    getInternalDocumentPath(
      internal("district-guides", { id: "d", district: "atlantis" }),
      "tr",
      now,
    ),
    null,
  );
});

test("internal links become paths and never keep the populated document", () => {
  const article = {
    id: "a1",
    slug: "kadikoy-rehberi",
    _status: "published",
    publishedAt: past,
    content: "secret body",
  };
  const prepared = prepareRichText(
    lexical(
      paragraph(
        link({
          linkType: "internal",
          newTab: false,
          doc: internal("articles", article),
        }),
        link({
          linkType: "internal",
          newTab: false,
          doc: internal("articles", "a2"),
        }),
        link({ linkType: "custom", newTab: true, url: "https://example.org" }),
      ),
    ),
    "tr",
    now,
  );
  const serialized = JSON.stringify(prepared);
  const links = (prepared as ReturnType<typeof lexical>).root.children[0] as {
    children: Array<{ fields: Record<string, unknown> }>;
  };

  assert.deepEqual(links.children[0]?.fields, {
    linkType: "custom",
    newTab: false,
    doc: null,
    url: "/makaleler/kadikoy-rehberi",
  });
  assert.deepEqual(links.children[1]?.fields, {
    linkType: "internal",
    newTab: false,
    doc: null,
  });
  assert.deepEqual(links.children[2]?.fields, {
    linkType: "custom",
    newTab: true,
    url: "https://example.org",
  });
  assert.equal(serialized.includes("secret body"), false);
});

test("uploads keep public fields only; captions are Turkish-only, credits stay", () => {
  const turkish = JSON.stringify(prepareRichText(lexical(upload()), "tr", now));
  const english = JSON.stringify(prepareRichText(lexical(upload()), "en", now));

  for (const serialized of [turkish, english]) {
    assert.ok(serialized.includes(mediaDocument.sourceCopyright));
    assert.ok(serialized.includes(mediaDocument.url));
    assert.equal(serialized.includes("private-object-key"), false);
    assert.equal(serialized.includes("filesize"), false);
  }
  assert.ok(turkish.includes(mediaDocument.description));
  assert.equal(english.includes(mediaDocument.description), false);
});

test("relationship nodes are dropped and logged", (t) => {
  const warn = t.mock.method(console, "warn", () => {});
  const prepared = prepareRichText(
    lexical(
      relationship({ id: "a9", title: "Gizli taslak" }),
      paragraph(text("Kalan metin")),
    ),
    "tr",
    now,
  );
  const serialized = JSON.stringify(prepared);

  assert.equal(serialized.includes("Gizli taslak"), false);
  assert.equal(serialized.includes('"relationship"'), false);
  assert.ok(serialized.includes("Kalan metin"));
  assert.equal(warn.mock.callCount(), 1);
  assert.match(String(warn.mock.calls[0]?.arguments[0]), /relationship node/);
});

test("a legacy h1 in the body becomes an h2", () => {
  const prepared = JSON.stringify(
    prepareRichText(
      lexical(
        { ...heading("h2", "Eski başlık"), tag: "h1" },
        heading("h3", "Alt başlık"),
      ),
      "tr",
      now,
    ),
  );

  assert.equal(prepared.includes('"tag":"h1"'), false);
  assert.ok(prepared.includes('"tag":"h2"'));
  assert.ok(prepared.includes('"tag":"h3"'));
});

test("non-Lexical values pass through unchanged", () => {
  assert.equal(prepareRichText(null, "tr", now), null);
  assert.deepEqual(prepareRichText({ root: "x" }, "tr", now), { root: "x" });
});

test("every collection the editor can link to resolves to a public page", () => {
  const published = { _status: "published", publishedAt: past };
  const fixtures: Record<(typeof INTERNAL_LINK_COLLECTIONS)[number], unknown> =
    {
      articles: { ...published, id: "a", slug: "yazi" },
      pages: {
        ...published,
        id: "p",
        slug: "sayfa",
        language: "tr",
        pageType: "standard",
      },
      books: {
        ...published,
        id: "b",
        slug: "kitap",
        language: "tr",
        reviewStatus: "published",
        seo: { index: true },
      },
      photos: {
        ...published,
        id: "f",
        slug: "galata",
        title: "Galata",
        altText: "Galata Kulesi",
      },
      "district-guides": { id: "d", district: "esenler" },
    };

  for (const collection of INTERNAL_LINK_COLLECTIONS) {
    assert.notEqual(
      getInternalDocumentPath(
        internal(collection, fixtures[collection]),
        "tr",
        now,
      ),
      null,
      collection,
    );
  }
});
