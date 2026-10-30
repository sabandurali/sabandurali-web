import assert from "node:assert/strict";
import test from "node:test";
import { articleListPaths } from "./articles/article-routes";
import {
  createListPageMetadata,
  getFilledListPaths,
  listContentOf,
  loadListContent,
} from "./list-seo";
import { createPhotoListMetadata } from "./photos/photo-list-seo";
import { feedLinks } from "@/lib/metadata";

const site = "https://www.sabandurali.com";
// Page 1 of a publication list announces the Atom feed of its language.
const feed = {
  types: {
    "application/atom+xml": [
      { url: `${site}/feed.xml`, title: feedLinks.tr.title },
    ],
  },
};

function articles(content: { tr: boolean; en: boolean }) {
  return createListPageMetadata({
    title: "Makaleler | Şaban Durali",
    description: "Makaleler",
    locale: "tr",
    paths: articleListPaths,
    content,
  });
}

test("a list with items in both languages is indexed and paired", () => {
  const metadata = articles({ tr: true, en: true });

  assert.deepEqual(metadata.robots, { index: true, follow: true });
  assert.deepEqual(metadata.alternates, {
    canonical: `${site}/makaleler`,
    languages: {
      "tr-TR": `${site}/makaleler`,
      en: `${site}/en/articles`,
      "x-default": `${site}/makaleler`,
    },
    ...feed,
  });
});

test("an empty other-language list is not a hreflang alternate", () => {
  assert.deepEqual(articles({ tr: true, en: false }).alternates, {
    canonical: `${site}/makaleler`,
    ...feed,
  });
});

test("an empty list is noindex and outside the hreflang cluster", () => {
  const metadata = articles({ tr: false, en: true });

  assert.deepEqual(metadata.robots, { index: false, follow: true });
  assert.deepEqual(metadata.alternates, {
    canonical: `${site}/makaleler`,
    ...feed,
  });
});

test("list content comes from the items or from one read per language", async () => {
  assert.deepEqual(listContentOf([{ language: "en" }]), {
    tr: false,
    en: true,
  });
  assert.deepEqual(
    getFilledListPaths(articleListPaths, { tr: false, en: true }),
    { en: "/en/articles" },
  );
  assert.deepEqual(await loadListContent(async (locale) => locale === "tr"), {
    tr: true,
    en: false,
  });
});

test("photo list page 1 follows the list rule", () => {
  const metadata = createPhotoListMetadata(
    "tr",
    {},
    { page: 1, totalItems: 30 },
    { tr: true, en: true },
  );

  assert.deepEqual(metadata.robots, { index: true, follow: true });
  assert.equal(
    (metadata.alternates?.languages as Record<string, string>).en,
    `${site}/en/photography`,
  );
  assert.deepEqual(
    createPhotoListMetadata(
      "en",
      {},
      { page: 1, totalItems: 0 },
      { tr: true, en: true },
    ).robots,
    { index: false, follow: true },
    "the served list decides for its own language",
  );
});

test("later photo pages are their own indexable canonical, without hreflang", () => {
  const metadata = createPhotoListMetadata(
    "tr",
    { page: 3 },
    { page: 2, totalItems: 30 },
    { tr: true, en: true },
  );

  assert.deepEqual(metadata.robots, { index: true, follow: true });
  // The served page (clamped), not the requested one.
  assert.deepEqual(metadata.alternates, {
    canonical: `${site}/fotograflar?page=2`,
  });
});

test("filtered photo views are noindex with a self canonical", () => {
  const metadata = createPhotoListMetadata(
    "en",
    { tag: "kule", collection: "istanbul" },
    { page: 1, totalItems: 2 },
    { tr: true, en: true },
  );

  assert.deepEqual(metadata.robots, { index: false, follow: true });
  assert.deepEqual(metadata.alternates, {
    canonical: `${site}/en/photography?collection=istanbul&tag=kule`,
  });
});
