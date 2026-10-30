import assert from "node:assert/strict";
import test from "node:test";
import { homeUrls, siteSocialImage } from "@/config/site";
import {
  createPublicPageMetadata,
  getPublicPagePath,
  isHomePageIndexable,
} from "./page-seo";
import type { PublicPage } from "./public-types";

const site = "https://www.sabandurali.com";

function page(overrides: Partial<PublicPage> = {}): PublicPage {
  return {
    id: "page",
    title: "Projeler",
    slug: "projeler",
    language: "tr",
    pageType: "standard",
    summary: "",
    layout: [],
    publishedAt: "2026-10-01T00:00:00Z",
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-02T00:00:00Z",
    seo: {
      title: "Projeler | Şaban Durali",
      description: "Projeler",
      index: true,
      follow: true,
      socialImage: null,
    },
    ...overrides,
  };
}

test("home pages pair both languages exactly like the home routes", () => {
  for (const language of ["tr", "en"] as const) {
    const metadata = createPublicPageMetadata(
      page({ language, pageType: "home", slug: "home" }),
    );

    assert.deepEqual(metadata.alternates?.languages, homeUrls);
    assert.equal(
      metadata.alternates?.canonical,
      language === "tr" ? homeUrls["tr-TR"] : homeUrls.en,
    );
  }
});

test("a noindex home page is neither in a hreflang pair nor a target of one", () => {
  const home = page({ language: "tr", pageType: "home", slug: "home" });
  const noindexHome = page({
    language: "en",
    pageType: "home",
    slug: "home",
    seo: { ...home.seo, index: false },
  });

  assert.equal(isHomePageIndexable(null), true, "static home");
  assert.equal(isHomePageIndexable(home), true);
  assert.equal(isHomePageIndexable(noindexHome), false);
  assert.deepEqual(createPublicPageMetadata(noindexHome).alternates, {
    canonical: homeUrls.en,
  });
  assert.deepEqual(
    createPublicPageMetadata(home, {
      translationIndexable: isHomePageIndexable(noindexHome),
    }).alternates,
    { canonical: homeUrls["tr-TR"] },
  );
});

test("standard pages are Turkish-only and get the default social image", () => {
  const metadata = createPublicPageMetadata(page());

  assert.equal(getPublicPagePath(page()), "/projeler");
  assert.deepEqual(metadata.alternates, {
    canonical: `${site}/projeler`,
  });
  assert.deepEqual(metadata.openGraph, {
    title: "Projeler | Şaban Durali",
    description: "Projeler",
    url: `${site}/projeler`,
    siteName: "Şaban Durali",
    locale: "tr_TR",
    images: [siteSocialImage],
    type: "website",
  });
});

test("CMS robots settings and image size are kept", () => {
  const metadata = createPublicPageMetadata(
    page({
      seo: {
        title: "T",
        description: "D",
        index: false,
        follow: false,
        socialImage: {
          src: "/api/media/file/share.jpg",
          alt: "",
          width: 1200,
          height: 630,
        },
      },
    }),
  );

  assert.deepEqual(metadata.robots, { index: false, follow: false });
  assert.deepEqual(metadata.twitter?.images, [
    {
      url: `${site}/api/media/file/share.jpg`,
      alt: "Projeler",
      width: 1200,
      height: 630,
    },
  ]);
});

test("CORRECTNESS-2: the legacy ana-sayfa record always lives at /", () => {
  // `/ana-sayfa` redirects to `/` whether or not the record is served as home.
  assert.equal(getPublicPagePath(page({ slug: "ana-sayfa" })), "/");
  assert.equal(
    getPublicPagePath(page({ slug: "ana-sayfa", pageType: "home" })),
    "/",
  );
});
