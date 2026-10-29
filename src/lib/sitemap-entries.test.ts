import assert from "node:assert/strict";
import test from "node:test";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import type { BookReview } from "@/content/books/types";
import type { DistrictGuide } from "@/content/districts/district-guide-projection";
import { districts } from "@/content/districts/district-registry";
import { isDistrictNewsPageIndexable } from "@/content/districts/district-seo";
import type { PublicPage } from "@/content/pages/public-types";
import type { PublicPhoto } from "@/content/photos/types";
import {
  buildBookReviewEntries,
  buildSitemap,
  buildStandardPageEntries,
  findBookReviewTranslation,
  getContentLastModified,
  loadSitemapSource,
  loadSitemapSourcesByKey,
  mergeSitemapEntries,
  type SitemapContent,
  type SitemapEntry,
} from "./sitemap-entries";

const site = "https://www.sabandurali.com";

function article(
  overrides: Partial<PublicArticleSummary> &
    Pick<PublicArticleSummary, "id" | "slug" | "language">,
): PublicArticleSummary {
  return {
    title: overrides.slug,
    translationKey: null,
    summary: "Summary",
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

const bookSeo = { title: "T", description: "D", index: true, follow: true };

function bookReview(
  overrides: Partial<BookReview> & Pick<BookReview, "id" | "slug" | "language">,
): BookReview {
  return {
    title: overrides.slug,
    translationGroupId: null,
    translationStatus: "none",
    originalTitle: null,
    authors: [],
    translator: null,
    publisher: null,
    originalPublisher: null,
    publicationYear: null,
    originalPublicationYear: null,
    edition: null,
    isbn10: null,
    isbn13: null,
    pageCount: null,
    coverImage: null,
    category: null,
    tags: [],
    readingStatus: "completed",
    reviewStatus: "published",
    startedAt: null,
    completedAt: null,
    summary: "Summary",
    keyIdeas: [],
    strengths: [],
    weaknesses: [],
    whoShouldRead: [],
    whoShouldNotRead: [],
    applicationNotes: [],
    personalEvaluation: "Evaluation",
    rating: null,
    quotes: [],
    relatedBookIds: [],
    authorId: null,
    editorId: null,
    featured: false,
    showOnHomepage: false,
    seo: bookSeo,
    createdAt: "2026-03-01T09:00:00.000Z",
    updatedAt: "2026-03-02T09:00:00.000Z",
    publishedAt: "2026-03-01T09:00:00.000Z",
    ...overrides,
  };
}

function photo(
  overrides: Partial<PublicPhoto> &
    Pick<PublicPhoto, "id" | "slug" | "language">,
): PublicPhoto {
  return {
    title: overrides.slug,
    description: null,
    image: { src: `/api/media/file/${overrides.slug}.jpg`, alt: "Photo" },
    collections: [],
    tags: [],
    takenAt: null,
    locationName: null,
    district: null,
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
    updatedAt: "2026-06-03T09:00:00.000Z",
    seo: { title: "T", description: "D", openGraphImage: null },
    ...overrides,
  };
}

function page(
  overrides: Partial<PublicPage> & Pick<PublicPage, "id" | "slug">,
): PublicPage {
  return {
    title: overrides.slug,
    language: "tr",
    pageType: "standard",
    summary: "",
    layout: [],
    publishedAt: "2026-04-01T09:00:00.000Z",
    createdAt: "2026-04-01T09:00:00.000Z",
    updatedAt: "2026-04-05T09:00:00.000Z",
    seo: {
      title: "T",
      description: "D",
      index: true,
      follow: true,
      socialImage: null,
    },
    ...overrides,
  };
}

test("English standard pages never reach the sitemap", () => {
  const entries = buildStandardPageEntries([
    page({ id: "tr-1", slug: "kunye" }),
    page({ id: "en-1", slug: "about", language: "en" }),
  ]);

  assert.deepEqual(
    entries.map((entry) => entry.url),
    [`${site}/kunye`],
  );
});

function guide(overrides: Partial<DistrictGuide> = {}): DistrictGuide {
  return {
    summary: null,
    history: null,
    geography: null,
    life: null,
    transportation: null,
    placesGuide: null,
    distinctiveFeatures: null,
    researchTopics: null,
    facts: null,
    neighborhoods: [],
    housingTexture: null,
    regionalAssessment: null,
    marketData: null,
    planningDevelopments: [],
    sources: [],
    updatedAt: "2026-09-10T09:00:00.000Z",
    ...overrides,
  };
}

const emptyContent: SitemapContent = {
  articles: [],
  bookReviews: [],
  photos: [],
  standardPages: [],
  homePages: {
    tr: { source: "static", page: null },
    en: { source: "static", page: null },
  },
  districtGuides: new Map(),
  districtNews: [],
};

function byUrl(entries: readonly SitemapEntry[], path: string) {
  return entries.find((entry) => entry.url === `${site}${path}`);
}

function urls(entries: readonly SitemapEntry[]): string[] {
  return entries.map((entry) => entry.url);
}

const realEstateArticle = article({
  id: "a-tr",
  slug: "istanbul-konut",
  language: "tr",
  translationKey: "pair",
  categories: [
    { id: "c", name: "Gayrimenkul", slug: "gayrimenkul", sortOrder: 0 },
  ],
  updatedAt: "2026-07-10T09:00:00.000Z",
});
const realEstateArticleEnglish = article({
  id: "a-en",
  slug: "istanbul-housing",
  language: "en",
  translationKey: "pair",
});

const fullContent: SitemapContent = {
  articles: [
    realEstateArticle,
    realEstateArticleEnglish,
    article({
      id: "noindex",
      slug: "gizli",
      language: "tr",
      seo: { title: "T", description: "D", index: false, follow: true },
    }),
    article({
      id: "elsewhere",
      slug: "baska-adres",
      language: "tr",
      seo: {
        title: "T",
        description: "D",
        index: true,
        follow: true,
        canonical: "https://example.com/original",
      },
    }),
  ],
  bookReviews: [
    bookReview({ id: "b-tr", slug: "kitap", language: "tr" }),
    bookReview({
      id: "b-en",
      slug: "book",
      language: "en",
      translationSourceBookReviewId: "b-tr",
    }),
  ],
  photos: [
    photo({
      id: "p1",
      slug: "galata",
      language: "tr",
      collections: [
        {
          id: "col",
          title: "İstanbul",
          slug: "istanbul",
          parentId: null,
          sortOrder: 0,
        },
      ],
      updatedAt: "2026-08-01T09:00:00.000Z",
    }),
    photo({ id: "p1", slug: "galata-en", language: "en" }),
    photo({
      id: "p2",
      slug: "blob",
      language: "tr",
      image: {
        src: "https://store.public.blob.vercel-storage.com/blob.jpg",
        alt: "Blob",
      },
    }),
  ],
  standardPages: [
    page({ id: "legacy-home", slug: "ana-sayfa" }),
    page({ id: "projects", slug: "projeler" }),
    page({
      id: "hidden",
      slug: "taslak-gibi",
      seo: {
        title: "T",
        description: "D",
        index: false,
        follow: true,
        socialImage: null,
      },
    }),
  ],
  homePages: {
    tr: {
      source: "payload",
      page: page({
        id: "legacy-home",
        slug: "ana-sayfa",
        pageType: "home",
        updatedAt: "2026-09-01T09:00:00.000Z",
      }),
    },
    en: { source: "payload", page: null },
  },
  districtGuides: new Map<string, DistrictGuide | null>([
    [
      "esenler",
      guide({ summary: "Esenler özeti.", updatedAt: "2026-10-01T09:00:00Z" }),
    ],
    ["kadikoy", guide({ history: "Kadıköy tarihi." })],
    ["fatih", guide()],
    ["beyoglu", null],
  ]),
  districtNews: [
    article({
      id: "news-1",
      slug: "kadikoy-haberi",
      language: "tr",
      articleType: "district-news",
      district: "kadikoy",
      updatedAt: "2026-10-20T09:00:00.000Z",
    }),
    article({
      id: "news-2",
      slug: "kadikoy-eski-haber",
      language: "tr",
      articleType: "district-news",
      district: "kadikoy",
      updatedAt: "2026-09-20T09:00:00.000Z",
    }),
    // A district whose guide is not indexable still has an indexable news
    // list: the news page decides on its own items.
    article({
      id: "news-3",
      slug: "beyoglu-haberi",
      language: "tr",
      articleType: "district-news",
      district: "beyoglu",
    }),
  ],
};

test("every URL is listed once, absolute and on the site origin", () => {
  for (const content of [emptyContent, fullContent]) {
    const sitemap = buildSitemap(content);
    assert.equal(new Set(urls(sitemap)).size, sitemap.length);
    for (const entry of sitemap) assert.ok(entry.url.startsWith(`${site}/`));
  }
});

test("hreflang clusters are reciprocal and only point to listed URLs", () => {
  const sitemap = buildSitemap(fullContent);
  const listed = new Set(urls(sitemap));

  for (const entry of sitemap) {
    const languages = entry.alternates?.languages;
    if (languages === undefined) continue;
    const values = Object.values(languages);
    assert.ok(values.includes(entry.url), `${entry.url} lists itself`);
    assert.equal(languages["x-default"], languages["tr-TR"]);
    for (const alternate of values) {
      assert.ok(typeof alternate === "string" && listed.has(alternate));
      assert.deepEqual(
        sitemap.find((candidate) => candidate.url === alternate)?.alternates,
        entry.alternates,
      );
    }
  }
});

test("static pages carry no invented lastModified", () => {
  const sitemap = buildSitemap(emptyContent);

  for (const path of [
    "/",
    "/en",
    "/hakkimda",
    "/iletisim",
    "/en/contact",
    "/kvkk-aydinlatma-metni",
    "/en/privacy-notice",
    "/calisma-alanlari",
    "/gayrimenkul-ve-istanbul",
    "/istanbul/ilceler",
    "/makaleler",
  ]) {
    const entry = byUrl(sitemap, path);
    assert.ok(entry, `${path} is listed`);
    assert.equal(entry.lastModified, undefined, `${path} has no lastModified`);
  }
});

test("dates come from content: items, newest list item, guide, CMS home", () => {
  const sitemap = buildSitemap(fullContent);

  assert.deepEqual(
    byUrl(sitemap, "/makaleler/istanbul-konut")?.lastModified,
    new Date("2026-07-10T09:00:00.000Z"),
  );
  assert.deepEqual(
    byUrl(sitemap, "/makaleler")?.lastModified,
    new Date("2026-07-10T09:00:00.000Z"),
  );
  assert.deepEqual(
    byUrl(sitemap, "/en/articles")?.lastModified,
    new Date("2026-05-02T09:00:00.000Z"),
  );
  assert.deepEqual(
    byUrl(sitemap, "/istanbul/ilceler/esenler")?.lastModified,
    new Date("2026-10-01T09:00:00Z"),
  );
  assert.deepEqual(
    byUrl(sitemap, "/istanbul/ilceler")?.lastModified,
    new Date("2026-10-01T09:00:00Z"),
  );
  assert.deepEqual(
    byUrl(sitemap, "/")?.lastModified,
    new Date("2026-09-01T09:00:00.000Z"),
  );
  assert.equal(byUrl(sitemap, "/en")?.lastModified, undefined);
});

test("a scheduled item changes on the site at its publication date", () => {
  // Saved on 1 September, published on 15 September.
  const scheduled = article({
    id: "scheduled",
    slug: "planli-yazi",
    language: "tr",
    updatedAt: "2026-09-01T09:00:00.000Z",
    publishedAt: "2026-09-15T06:00:00.000Z",
  });
  const sitemap = buildSitemap({ ...emptyContent, articles: [scheduled] });
  const published = new Date("2026-09-15T06:00:00.000Z");

  assert.deepEqual(
    byUrl(sitemap, "/makaleler/planli-yazi")?.lastModified,
    published,
  );
  assert.deepEqual(byUrl(sitemap, "/makaleler")?.lastModified, published);
  assert.deepEqual(
    getContentLastModified({
      updatedAt: "2026-09-20T09:00:00.000Z",
      publishedAt: "2026-09-15T06:00:00.000Z",
    }),
    new Date("2026-09-20T09:00:00.000Z"),
  );
  assert.equal(
    getContentLastModified({ updatedAt: "not a date", publishedAt: null }),
    undefined,
  );
});

test("noindex, foreign-canonical and duplicate home records stay out", () => {
  const sitemap = buildSitemap(fullContent);

  assert.equal(byUrl(sitemap, "/makaleler/gizli"), undefined);
  assert.equal(byUrl(sitemap, "/makaleler/baska-adres"), undefined);
  assert.equal(byUrl(sitemap, "/taslak-gibi"), undefined);
  assert.equal(byUrl(sitemap, "/ana-sayfa"), undefined);
  assert.ok(byUrl(sitemap, "/projeler"));
  assert.equal(urls(sitemap).includes("https://example.com/original"), false);
});

test("a CMS home page with index disabled is not listed", () => {
  const sitemap = buildSitemap({
    ...emptyContent,
    homePages: {
      tr: { source: "static", page: null },
      en: {
        source: "payload",
        page: page({
          id: "en-home",
          slug: "home",
          language: "en",
          pageType: "home",
          seo: {
            title: "T",
            description: "D",
            index: false,
            follow: true,
            socialImage: null,
          },
        }),
      },
    },
  });

  assert.equal(byUrl(sitemap, "/en"), undefined);
  assert.equal(byUrl(sitemap, "/")?.alternates, undefined);
});

test("placeholder pages and empty workspace sections are not listed", () => {
  for (const content of [emptyContent, fullContent]) {
    const sitemap = buildSitemap(content);
    for (const path of [
      "/hakkimda/biyografi",
      "/hakkimda/egitim-sertifikalar-diplomalar",
      "/gayrimenkul-ve-istanbul/hesaplama-araclari",
      "/gayrimenkul-ve-istanbul/sehir-ve-imar",
      "/kitaplar-ve-ogrenme/kitap-incelemeleri",
      "/fotograf/galeriler",
    ]) {
      assert.equal(byUrl(sitemap, path), undefined, `${path} is not listed`);
    }
  }
});

test("workspace sections with published content are listed with its date", () => {
  const sitemap = buildSitemap(fullContent);

  assert.deepEqual(
    byUrl(sitemap, "/gayrimenkul-ve-istanbul/gayrimenkul-rehberleri")
      ?.lastModified,
    new Date("2026-07-10T09:00:00.000Z"),
  );
  assert.deepEqual(
    byUrl(sitemap, "/fotograf/istanbul")?.lastModified,
    new Date("2026-08-01T09:00:00.000Z"),
  );
  assert.ok(byUrl(sitemap, "/gayrimenkul-ve-istanbul"));
});

test("list pages linked from workspaces are listed once with alternates", () => {
  const sitemap = buildSitemap(fullContent);

  for (const [path, english] of [
    ["/kitaplar", "/en/books"],
    ["/fotograflar", "/en/photography"],
    ["/makaleler", "/en/articles"],
  ] as const) {
    assert.equal(
      urls(sitemap).filter((url) => url === `${site}${path}`).length,
      1,
    );
    assert.deepEqual(byUrl(sitemap, path)?.alternates?.languages, {
      "tr-TR": `${site}${path}`,
      en: `${site}${english}`,
      "x-default": `${site}${path}`,
    });
  }
  assert.equal(
    urls(sitemap).filter((url) => url === `${site}/istanbul/ilceler`).length,
    1,
  );
});

test("district pages are listed only with an indexable guide", () => {
  assert.equal(
    urls(buildSitemap(emptyContent)).some((url) =>
      url.startsWith(`${site}/istanbul/ilceler/`),
    ),
    false,
  );

  const sitemap = buildSitemap(fullContent);
  assert.ok(byUrl(sitemap, "/istanbul/ilceler/esenler"));
  assert.ok(byUrl(sitemap, "/istanbul/ilceler/kadikoy"));
  assert.equal(byUrl(sitemap, "/istanbul/ilceler/fatih"), undefined);
  assert.equal(byUrl(sitemap, "/istanbul/ilceler/beyoglu"), undefined);
  assert.equal(byUrl(sitemap, "/istanbul/ilceler/adalar"), undefined);

  const all = buildSitemap({
    ...emptyContent,
    districtGuides: new Map(
      districts.map((district) => [
        district.slug,
        guide({ summary: `${district.name} özeti.` }),
      ]),
    ),
  });
  assert.equal(
    urls(all).filter((url) => url.startsWith(`${site}/istanbul/ilceler/`))
      .length,
    39,
  );
});

test("district news lists with news are listed like the news page indexes them", () => {
  const sitemap = buildSitemap(fullContent);
  const kadikoy = byUrl(sitemap, "/istanbul/ilceler/kadikoy/haberler");

  assert.ok(kadikoy);
  assert.equal(
    kadikoy.lastModified?.valueOf(),
    new Date("2026-10-20T09:00:00.000Z").valueOf(),
  );
  assert.ok(byUrl(sitemap, "/istanbul/ilceler/beyoglu/haberler"));
  assert.equal(byUrl(sitemap, "/istanbul/ilceler/esenler/haberler"), undefined);
  assert.equal(
    urls(buildSitemap(emptyContent)).some((url) => url.endsWith("/haberler")),
    false,
  );

  for (const district of ["kadikoy", "esenler"]) {
    const items = fullContent.districtNews.filter(
      (item) => item.district === district,
    );
    assert.equal(
      byUrl(sitemap, `/istanbul/ilceler/${district}/haberler`) !== undefined,
      isDistrictNewsPageIndexable(items),
    );
  }
});

test("photo image URLs are absolute and photo translations are paired", () => {
  const sitemap = buildSitemap(fullContent);

  assert.deepEqual(byUrl(sitemap, "/fotograflar/galata")?.images, [
    `${site}/api/media/file/galata.jpg`,
  ]);
  assert.deepEqual(byUrl(sitemap, "/fotograflar/blob")?.images, [
    "https://store.public.blob.vercel-storage.com/blob.jpg",
  ]);
  assert.deepEqual(
    byUrl(sitemap, "/fotograflar/galata")?.alternates?.languages,
    {
      "tr-TR": `${site}/fotograflar/galata`,
      en: `${site}/en/photography/galata-en`,
      "x-default": `${site}/fotograflar/galata`,
    },
  );
  assert.equal(byUrl(sitemap, "/fotograflar/blob")?.alternates, undefined);
});

test("a one-sided CMS translation link pairs both book reviews", () => {
  const turkish = bookReview({ id: "b-tr", slug: "kitap", language: "tr" });
  const english = bookReview({
    id: "b-en",
    slug: "book",
    language: "en",
    translationSourceBookReviewId: "b-tr",
  });
  const expected = {
    "tr-TR": `${site}/kitaplar/kitap`,
    en: `${site}/en/books/book`,
    "x-default": `${site}/kitaplar/kitap`,
  };

  assert.equal(findBookReviewTranslation(turkish, [turkish, english]), english);
  assert.equal(findBookReviewTranslation(english, [turkish, english]), turkish);
  for (const entry of buildBookReviewEntries([turkish, english])) {
    assert.deepEqual(entry.alternates?.languages, expected);
  }
});

test("reviews without a direct link pair through the shared translation group", () => {
  const turkish = bookReview({
    id: "s-tr",
    slug: "ultra-ogrenme",
    language: "tr",
    translationGroupId: "group-ultralearning",
  });
  const english = bookReview({
    id: "s-en",
    slug: "ultralearning",
    language: "en",
    translationGroupId: "group-ultralearning",
  });
  const unrelated = bookReview({
    id: "x-en",
    slug: "other",
    language: "en",
    translationGroupId: "group-other",
  });

  assert.equal(
    findBookReviewTranslation(turkish, [turkish, unrelated, english]),
    english,
  );
  assert.equal(findBookReviewTranslation(english, [turkish, english]), turkish);
  assert.equal(findBookReviewTranslation(unrelated, [turkish]), undefined);
});

test("noindex reviews are not listed and not used as alternates", () => {
  const turkish = bookReview({ id: "b-tr", slug: "kitap", language: "tr" });
  const english = bookReview({
    id: "b-en",
    slug: "book",
    language: "en",
    translationSourceBookReviewId: "b-tr",
    seo: { ...bookSeo, index: false },
  });
  const entries = buildBookReviewEntries([turkish, english]);

  assert.deepEqual(urls(entries), [`${site}/kitaplar/kitap`]);
  assert.equal(entries[0]?.alternates, undefined);
});

test("merging keeps the first entry for a URL", () => {
  const first = { url: `${site}/a`, priority: 1 };
  assert.deepEqual(
    mergeSitemapEntries([first, { url: `${site}/a`, priority: 0.1 }]),
    [first],
  );
});

test("a failing source falls back and is reported", async () => {
  const reports: string[] = [];
  const report = (source: string, error: unknown) => {
    reports.push(`${source}: ${error instanceof Error ? error.message : ""}`);
  };

  assert.deepEqual(
    await loadSitemapSource(
      "Turkish articles",
      async () => {
        throw new Error("database unavailable");
      },
      [],
      report,
    ),
    [],
  );
  assert.deepEqual(reports, ["Turkish articles: database unavailable"]);
  assert.equal(
    await loadSitemapSource("pages", async () => "ok", "fallback", report),
    "ok",
  );
  assert.equal(reports.length, 1);
});

test("one failing district does not hide the others", async () => {
  const reports: string[] = [];
  const guides = await loadSitemapSourcesByKey(
    "district guides",
    ["esenler", "fatih", "kadikoy"],
    async (slug) => {
      if (slug === "fatih") throw new Error("timeout");
      return guide({ summary: slug });
    },
    (source) => reports.push(source),
  );

  assert.deepEqual([...guides.keys()], ["esenler", "kadikoy"]);
  assert.deepEqual(reports, ["district guides (fatih)"]);
});

test("a load that throws synchronously only drops its own key", async () => {
  const reports: string[] = [];
  const guides = await loadSitemapSourcesByKey(
    "district guides",
    ["esenler", "fatih"],
    (slug) => {
      if (slug === "fatih") throw new Error("invalid configuration");
      return Promise.resolve(guide({ summary: slug }));
    },
    (source, error) =>
      reports.push(
        `${source}: ${error instanceof Error ? error.message : String(error)}`,
      ),
  );

  assert.deepEqual([...guides.keys()], ["esenler"]);
  assert.deepEqual(reports, ["district guides (fatih): invalid configuration"]);
});

test("a sitemap built from failed sources still lists every static page", () => {
  const sitemap = buildSitemap({
    ...emptyContent,
    homePages: { tr: null, en: null },
  });

  assert.ok(byUrl(sitemap, "/"));
  assert.ok(byUrl(sitemap, "/en"));
  assert.ok(byUrl(sitemap, "/iletisim"));
  assert.ok(byUrl(sitemap, "/istanbul/ilceler"));
  assert.ok(byUrl(sitemap, "/fotograf"));
});
