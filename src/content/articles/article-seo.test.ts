import assert from "node:assert/strict";
import test from "node:test";
import { siteSocialImage } from "@/config/site";
import { personEntityId } from "@/content/entity-seo";
import { articlePageContent } from "./article-page-content";
import {
  createArticleJsonLd,
  createArticleMetadata,
  createArticleStructuredData,
  getArticleCanonicalUrl,
  isArticleHreflangEligible,
  serializeArticleJsonLd,
} from "./article-seo";
import type { PublicArticle } from "./public-types";

const site = "https://www.sabandurali.com";
const owner = {
  "@type": "Person",
  "@id": personEntityId,
  name: "Şaban Durali",
  url: `${site}/`,
};

function payloadArticle(overrides: Partial<PublicArticle> = {}): PublicArticle {
  return {
    id: "article-1",
    title: "İstanbul'da konut",
    slug: "istanbulda-konut",
    language: "tr",
    translationKey: "article-1",
    summary: "Özet",
    content: { source: "lexical", data: null },
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
    seo: {
      title: "İstanbul'da konut | Şaban Durali",
      description: "Açıklama",
      index: true,
      follow: true,
    },
    ...overrides,
  };
}

function staticArticle(authorName: string | null): PublicArticle {
  return payloadArticle({
    content: {
      source: "static",
      blocks: [],
      details: {
        author: authorName === null ? null : { id: "author", name: authorName },
        faq: [],
        legalNotice: { required: false },
        sources: [],
      },
    },
  });
}

test("CMS articles name the site owner as BlogPosting author", () => {
  const jsonLd = createArticleJsonLd(payloadArticle());

  assert.equal(jsonLd["@type"], "BlogPosting");
  assert.deepEqual(jsonLd.author, owner);
});

test("CMS articles name a guest author and keep the owner entity otherwise", () => {
  assert.deepEqual(
    createArticleJsonLd(payloadArticle({ author: "Konuk Yazar" })).author,
    { "@type": "Person", name: "Konuk Yazar" },
  );
  const metadata = createArticleMetadata(
    payloadArticle({ author: "Konuk Yazar" }),
    null,
  );
  assert.deepEqual(
    (metadata.openGraph as { authors?: unknown } | undefined)?.authors,
    ["Konuk Yazar"],
  );
  assert.deepEqual(createArticleJsonLd(payloadArticle()).author, owner);
});

test("static articles keep their author and default to the owner", () => {
  assert.deepEqual(
    createArticleJsonLd(staticArticle("Şaban Durali")).author,
    owner,
  );
  assert.deepEqual(createArticleJsonLd(staticArticle(null)).author, owner);
  assert.deepEqual(createArticleJsonLd(staticArticle("Konuk Yazar")).author, {
    "@type": "Person",
    name: "Konuk Yazar",
  });
});

test("article metadata emits canonical, hreflang pair, OG article and Twitter", () => {
  const metadata = createArticleMetadata(payloadArticle(), {
    id: "article-1",
    language: "en",
    slug: "housing-in-istanbul",
    title: "Housing in Istanbul",
    seo: { index: true },
  });

  assert.equal(
    metadata.alternates?.canonical,
    `${site}/makaleler/istanbulda-konut`,
  );
  assert.deepEqual(metadata.alternates?.languages, {
    "tr-TR": `${site}/makaleler/istanbulda-konut`,
    en: `${site}/en/articles/housing-in-istanbul`,
    "x-default": `${site}/makaleler/istanbulda-konut`,
  });
  assert.deepEqual(metadata.robots, { index: true, follow: true });
  assert.deepEqual(metadata.openGraph, {
    title: "İstanbul'da konut | Şaban Durali",
    description: "Açıklama",
    url: `${site}/makaleler/istanbulda-konut`,
    siteName: "Şaban Durali",
    locale: "tr_TR",
    alternateLocale: ["en_US"],
    images: [siteSocialImage],
    type: "article",
    publishedTime: "2026-05-01T09:00:00.000Z",
    modifiedTime: "2026-05-02T09:00:00.000Z",
    authors: ["Şaban Durali"],
  });
  assert.deepEqual(metadata.twitter, {
    card: "summary_large_image",
    title: "İstanbul'da konut | Şaban Durali",
    description: "Açıklama",
    images: [siteSocialImage],
  });
});

test("CITE-THIS: article metadata carries citation tags from the article's own data", () => {
  const metadata = createArticleMetadata(payloadArticle(), null);
  assert.deepEqual(metadata.other, {
    citation_title: "İstanbul'da konut",
    citation_author: ["Şaban Durali"],
    citation_publication_date: "2026/05/01",
    citation_online_date: "2026/05/01",
    citation_language: "tr",
    citation_public_url: `${site}/makaleler/istanbulda-konut`,
  });

  const guest = createArticleMetadata(
    payloadArticle({
      author: "Ayşe Yılmaz",
      seo: {
        title: "İstanbul'da konut | Şaban Durali",
        description: "Açıklama",
        index: true,
        follow: true,
        canonical: "/makaleler/baska-adres",
      },
    }),
    null,
  ).other;
  assert.ok(guest);
  assert.deepEqual(guest.citation_author, ["Ayşe Yılmaz"]);
  // The canonical URL the page declares, not the route-derived one.
  assert.equal(guest.citation_public_url, `${site}/makaleler/baska-adres`);
});

test("a CMS featured image is shared through the image optimizer", () => {
  const metadata = createArticleMetadata(
    payloadArticle({
      featuredImage: {
        source: "payload",
        src: "/api/media/file/konut.jpg",
        alt: "Konut dokusu",
        width: 3000,
        height: 2000,
      },
      seo: {
        title: "T",
        description: "D",
        index: true,
        follow: true,
        openGraphImage: "/api/media/file/konut.jpg",
      },
    }),
    null,
  );
  const expected = [
    {
      url: `${site}/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fkonut.jpg&w=1200&q=75`,
      alt: "Konut dokusu",
      width: 1200,
      height: 800,
    },
  ];

  assert.deepEqual(
    metadata.openGraph !== null &&
      metadata.openGraph !== undefined &&
      "images" in metadata.openGraph
      ? metadata.openGraph.images
      : null,
    expected,
  );
  assert.deepEqual(metadata.twitter?.images, expected);
  assert.equal(metadata.alternates?.languages, undefined);
});

test("noindex and a custom canonical are respected", () => {
  const article = payloadArticle({
    seo: {
      title: "T",
      description: "D",
      index: false,
      follow: false,
      canonical: "/makaleler/asil-yazi",
    },
  });
  const metadata = createArticleMetadata(article, null);

  assert.equal(getArticleCanonicalUrl(article), `${site}/makaleler/asil-yazi`);
  assert.equal(metadata.alternates?.canonical, `${site}/makaleler/asil-yazi`);
  assert.deepEqual(metadata.robots, { index: false, follow: false });
});

test("serialized JSON-LD cannot close the script element", () => {
  const serialized = serializeArticleJsonLd(
    payloadArticle({ title: "</script><script>alert(1)</script>" }),
  );

  assert.equal(serialized.includes("<"), false);
  assert.equal(
    JSON.parse(serialized)["@graph"][0].headline,
    "</script><script>alert(1)</script>",
  );
});

const english = {
  id: "article-1",
  language: "en",
  slug: "housing-in-istanbul",
  title: "Housing in Istanbul",
} as const;

test("a noindex or foreign-canonical translation is not an hreflang alternate", () => {
  for (const seo of [
    { index: false },
    { index: true, canonical: "/en/articles/another-article" },
  ]) {
    const metadata = createArticleMetadata(payloadArticle(), {
      ...english,
      seo,
    });

    assert.equal(metadata.alternates?.languages, undefined);
    assert.equal(isArticleHreflangEligible({ ...english, seo }), false);
  }
  // A canonical that names its own URL keeps the pair.
  assert.equal(
    isArticleHreflangEligible({
      ...english,
      seo: { index: true, canonical: "/en/articles/housing-in-istanbul" },
    }),
    true,
  );
});

test("a page that is noindex or canonical elsewhere emits no hreflang at all", () => {
  for (const seo of [
    { index: false, follow: true },
    { index: true, follow: true, canonical: "/makaleler/asil-yazi" },
  ]) {
    const metadata = createArticleMetadata(
      payloadArticle({ seo: { title: "T", description: "D", ...seo } }),
      { ...english, seo: { index: true } },
    );

    assert.equal(metadata.alternates?.languages, undefined);
    assert.equal(
      metadata.openGraph !== null &&
        metadata.openGraph !== undefined &&
        "alternateLocale" in metadata.openGraph,
      false,
    );
  }
});

test("a scheduled article never reports a modification before publication", () => {
  // Saved on 1 October, scheduled for 10 October.
  const scheduled = payloadArticle({
    publishedAt: "2026-10-10T09:00:00.000Z",
    updatedAt: "2026-10-01T09:00:00.000Z",
  });
  const jsonLd = createArticleJsonLd(scheduled);
  const openGraph = createArticleMetadata(scheduled, null).openGraph;

  assert.equal(jsonLd.datePublished, "2026-10-10T09:00:00.000Z");
  assert.equal(jsonLd.dateModified, "2026-10-10T09:00:00.000Z");
  assert.ok(openGraph && "modifiedTime" in openGraph);
  assert.equal(openGraph.modifiedTime, "2026-10-10T09:00:00.000Z");
});

test("ARTICLE-BOOK-JSONLD: a BlogPosting names its publisher, site and sized image", () => {
  const jsonLd = createArticleJsonLd(
    payloadArticle({
      featuredImage: {
        source: "payload",
        src: "/api/media/file/konut.jpg",
        alt: "Konut",
        width: 2400,
        height: 1600,
      },
    }),
  );

  assert.equal(jsonLd["@id"], `${site}/makaleler/istanbulda-konut#article`);
  assert.equal(jsonLd.url, `${site}/makaleler/istanbulda-konut`);
  assert.deepEqual(jsonLd.publisher, owner);
  assert.deepEqual(jsonLd.isPartOf, {
    "@type": "WebSite",
    "@id": `${site}/#website`,
    name: "Şaban Durali",
    url: `${site}/`,
  });
  assert.deepEqual(jsonLd.image, {
    "@type": "ImageObject",
    url: `${site}/api/media/file/konut.jpg`,
    width: 2400,
    height: 1600,
  });
  // No size is guessed for an image without one.
  assert.deepEqual(
    createArticleJsonLd(
      payloadArticle({
        featuredImage: {
          source: "payload",
          src: "/api/media/file/konut.jpg",
          alt: "Konut",
        },
      }),
    ).image,
    { "@type": "ImageObject", url: `${site}/api/media/file/konut.jpg` },
  );
});

test("BREADCRUMB-JSONLD: the article trail matches the visible one and ends at the canonical URL", () => {
  for (const article of [
    payloadArticle(),
    payloadArticle({
      language: "en",
      slug: "housing-in-istanbul",
      title: "Housing in Istanbul",
    }),
  ]) {
    const graph = createArticleStructuredData(article)["@graph"];
    const breadcrumb = graph.find((node) => node["@type"] === "BreadcrumbList");
    assert.ok(breadcrumb && "itemListElement" in breadcrumb);
    const items = breadcrumb.itemListElement;
    assert.deepEqual(
      items.map((item) => item.name),
      [
        article.language === "tr" ? "Ana sayfa" : "Home",
        articlePageContent[article.language].listTitle,
        article.title,
      ],
    );
    assert.equal(items.at(-1)?.item, getArticleCanonicalUrl(article));
    assert.equal(items.at(-1)?.position, 3);
  }
});
