import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import { districts } from "@/content/districts/district-registry";
import type { PublicPhoto } from "@/content/photos/types";
import { getSearchTerms, normalizeForSearch } from "./normalize";
import { searchCopy } from "./search-copy";
import { createSearchDocuments } from "./search-documents";
import { getSearchPath, searchPaths } from "./search-routes";
import {
  createSearchIndex,
  readSearchQuery,
  searchDocumentKinds,
  searchQueryMaxLength,
  searchSite,
  type SearchDocument,
} from "./site-search";

function article(
  overrides: Partial<PublicArticleSummary> &
    Pick<PublicArticleSummary, "id" | "slug" | "title">,
): PublicArticleSummary {
  return {
    language: "tr",
    translationKey: null,
    summary: "Özet",
    categories: [],
    featuredImage: null,
    featured: false,
    articleType: "article",
    district: null,
    districtNeighborhood: null,
    newsCategory: null,
    externalSource: null,
    publishedAt: "2026-05-01T09:00:00.000Z",
    createdAt: "2026-05-01T09:00:00.000Z",
    updatedAt: "2026-05-02T09:00:00.000Z",
    seo: { title: "T", description: "D", index: true, follow: true },
    ...overrides,
  };
}

function photo(overrides: Partial<PublicPhoto> = {}): PublicPhoto {
  return {
    id: "p1",
    language: "tr",
    title: "Moda sahili",
    slug: "moda-sahili",
    description: "Akşamüstü Moda.",
    image: { src: "/api/media/file/moda.jpg", alt: "Moda" },
    collections: [
      {
        id: "c",
        title: "Kıyılar",
        slug: "kiyilar",
        parentId: null,
        sortOrder: 0,
      },
    ],
    tags: [],
    takenAt: null,
    locationName: "Kadıköy",
    district: "kadikoy",
    neighborhood: null,
    districtPhotoCategory: null,
    dayPeriod: null,
    photographer: "Şaban Durali",
    creditLicense: null,
    exif: {
      camera: null,
      lens: null,
      focalLength: null,
      aperture: null,
      shutterSpeed: null,
      iso: null,
    },
    featured: false,
    publishedAt: "2026-06-01T09:00:00.000Z",
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-06-01T09:00:00.000Z",
    seo: { title: "T", description: "D", openGraphImage: null },
    ...overrides,
  };
}

const content = {
  articles: [
    article({
      id: "a1",
      slug: "istanbulda-konut",
      title: "İstanbul'da konut piyasası",
      summary: "Kira ve satış fiyatları üzerine notlar.",
      categories: [{ id: "c", name: "Gayrimenkul", slug: "g", sortOrder: 0 }],
    }),
    article({
      id: "a2",
      slug: "housing",
      title: "Housing in Istanbul",
      language: "en",
    }),
  ],
  bookReviews: [],
  photos: [photo()],
  districtSummaries: new Map([
    ["kadikoy", "Kadıköy, Anadolu yakasının kültür merkezidir."],
  ]),
};

test("SITE-SEARCH: Turkish letters, case and accents meet in one form", () => {
  for (const variant of [
    "Kadıköy",
    "KADIKÖY",
    "kadikoy",
    "Kadikoy",
    "KADIKOY",
  ]) {
    assert.equal(normalizeForSearch(variant), "kadikoy", variant);
  }
  assert.equal(normalizeForSearch("İstanbul’da Şişli!"), "istanbul da sisli");
  assert.equal(normalizeForSearch("Çağlayan  Ğ  ü â"), "caglayan g u a");
  assert.equal(normalizeForSearch("ISTANBUL"), "istanbul");
  assert.deepEqual(getSearchTerms("  Moda   moda sahili "), ["moda", "sahili"]);
  assert.deepEqual(getSearchTerms(" … ! "), []);
});

test("SITE-SEARCH: every word must start a word of the page", () => {
  const index = createSearchIndex(createSearchDocuments("tr", content));

  const kadikoy = searchSite(index, "kadikoy");
  assert.deepEqual(
    kadikoy.groups.map((group) => [
      group.kind,
      group.results.map((result) => result.path),
    ]),
    [
      ["district", ["/istanbul/ilceler/kadikoy"]],
      ["photo", ["/fotograflar/moda-sahili"]],
    ],
  );
  // Word prefixes match ("kad" → Kadıköy); inner fragments do not.
  assert.ok(searchSite(index, "kad").total >= 1);
  assert.equal(searchSite(index, "dikoy").total, 0);
  // All words are required.
  assert.equal(searchSite(index, "konut kira").total, 1);
  assert.equal(searchSite(index, "konut kadıköy").total, 0);
  // Category names and photo collections are searchable.
  assert.equal(searchSite(index, "gayrimenkul").groups[0]?.kind, "article");
  assert.equal(searchSite(index, "kıyılar").total, 1);
});

test("SITE-SEARCH: an exact title comes first within its group", () => {
  const index = createSearchIndex([
    {
      kind: "district",
      title: "Fatih Sultan Mehmet",
      path: "/a",
      summary: null,
      language: "tr",
    },
    {
      kind: "district",
      title: "Fatih",
      path: "/b",
      summary: null,
      language: "tr",
    },
  ] satisfies SearchDocument[]);
  assert.deepEqual(
    searchSite(index, "fatih").groups[0]?.results.map((result) => result.path),
    ["/b", "/a"],
  );
});

test("SITE-SEARCH: an empty or blank query searches nothing", () => {
  const index = createSearchIndex(createSearchDocuments("tr", content));
  for (const query of ["", "   ", "!!!"]) {
    const result = searchSite(index, query);
    assert.equal(result.total, 0);
    assert.deepEqual(result.groups, []);
  }
});

test("SITE-SEARCH: the query is read once, trimmed and capped", () => {
  assert.equal(readSearchQuery(undefined), "");
  assert.equal(readSearchQuery(["  ilk  ", "ikinci"]), "ilk");
  assert.equal(
    readSearchQuery("a".repeat(searchQueryMaxLength + 50)).length,
    searchQueryMaxLength,
  );
  assert.equal(getSearchPath("tr", "kadıköy"), "/ara?q=kad%C4%B1k%C3%B6y");
  assert.equal(getSearchPath("en"), "/en/search");
});

test("SITE-SEARCH: each language searches its own content and the 39 guides", () => {
  const tr = createSearchDocuments("tr", content);
  const en = createSearchDocuments("en", content);

  assert.equal(tr.filter((doc) => doc.kind === "district").length, 39);
  assert.equal(en.filter((doc) => doc.kind === "district").length, 39);
  assert.equal(districts.length, 39);
  // District guides are Turkish pages on the English search too.
  assert.ok(
    en
      .filter((doc) => doc.kind === "district")
      .every((doc) => doc.language === "tr"),
  );
  assert.deepEqual(
    en.filter((doc) => doc.kind === "article").map((doc) => doc.path),
    ["/en/articles/housing"],
  );
  assert.equal(
    en.some((doc) => doc.kind === "workspace"),
    false,
  );
  assert.ok(tr.some((doc) => doc.path === "/gayrimenkul-ve-istanbul"));
  // A district without a published summary has none (no filler text).
  assert.equal(
    tr.find((doc) => doc.path === "/istanbul/ilceler/fatih")?.summary,
    null,
  );
});

test("SITE-SEARCH: both languages have the same copy and paths", () => {
  assert.deepEqual(
    Object.keys(searchCopy.tr).sort(),
    Object.keys(searchCopy.en).sort(),
  );
  for (const locale of ["tr", "en"] as const) {
    for (const kind of searchDocumentKinds) {
      assert.ok(searchCopy[locale].groups[kind], `${locale} ${kind}`);
    }
  }
  assert.deepEqual(searchPaths, { tr: "/ara", en: "/en/search" });
  assert.equal(
    searchCopy.tr.unavailable(["photos", "articles"]),
    "Fotoğraflar ve makaleler şu an aranamıyor; sonuçlar bunlar olmadan gösteriliyor.",
  );
  assert.equal(
    searchCopy.en.unavailable(["districts"]),
    "District guide summaries cannot be searched right now; the results are shown without them.",
  );
});

test("SITE-SEARCH: the search pages are noindex and read only public sources", () => {
  for (const file of [
    "src/app/(tr)/ara/page.tsx",
    "src/app/(en)/en/search/page.tsx",
  ]) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /createSearchRoute\("(tr|en)"\)/);
    assert.doesNotMatch(source, /export const (revalidate|dynamic)/);
  }
  const dataSource = readFileSync(
    "src/content/search/search-data-source.ts",
    "utf8",
  );
  // Only the public data sources, never the Payload client directly.
  assert.doesNotMatch(dataSource, /getPayload|overrideAccess/);
});
