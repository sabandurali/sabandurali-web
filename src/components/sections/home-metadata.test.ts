import assert from "node:assert/strict";
import test from "node:test";
import type { PublicPage } from "@/content/pages/public-types";
import { createHomeMetadata, staticHomeSeo } from "./home-metadata";

const site = "https://www.sabandurali.com";

test("the static Turkish home pairs '/' with '/en' and has social tags", () => {
  const metadata = createHomeMetadata("tr", null);

  assert.equal(metadata.title, staticHomeSeo.tr.title);
  assert.equal(metadata.alternates?.canonical, `${site}/`);
  assert.deepEqual(metadata.alternates?.languages, {
    "tr-TR": `${site}/`,
    en: `${site}/en`,
    "x-default": `${site}/`,
  });
  assert.deepEqual(metadata.robots, { index: true, follow: true });
  const openGraph = metadata.openGraph as Record<string, unknown> | undefined;
  assert.equal(openGraph?.locale, "tr_TR");
  assert.equal(openGraph?.type, "website");
  assert.equal(openGraph?.url, `${site}/`);
  const twitter = metadata.twitter as Record<string, unknown> | undefined;
  assert.equal(twitter?.card, "summary_large_image");
});

test("the static English home is canonical at '/en' with the same pair", () => {
  const metadata = createHomeMetadata("en", null);

  assert.equal(metadata.title, staticHomeSeo.en.title);
  assert.equal(metadata.alternates?.canonical, `${site}/en`);
  assert.deepEqual(metadata.alternates?.languages, {
    "tr-TR": `${site}/`,
    en: `${site}/en`,
    "x-default": `${site}/`,
  });
  const openGraph = metadata.openGraph as Record<string, unknown> | undefined;
  assert.equal(openGraph?.locale, "en_US");
});

function cmsHome(language: "tr" | "en"): PublicPage {
  return {
    id: "home-1",
    title: "Ana sayfa",
    slug: "ana-sayfa",
    language,
    pageType: "home",
    summary: "",
    layout: [],
    publishedAt: "2026-10-01T00:00:00.000Z",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    seo: {
      title: "CMS başlığı | Şaban Durali",
      description: "CMS açıklaması.",
      socialImage: null,
      index: true,
      follow: true,
    },
  };
}

test("a CMS home of the same locale supplies its own SEO values", () => {
  const metadata = createHomeMetadata("tr", cmsHome("tr"));

  assert.equal(metadata.title, "CMS başlığı | Şaban Durali");
  assert.equal(metadata.description, "CMS açıklaması.");
  assert.equal(metadata.alternates?.canonical, `${site}/`);
  assert.equal(
    (metadata.alternates?.languages as Record<string, string>).en,
    `${site}/en`,
  );
});

test("a CMS record of the other locale is ignored", () => {
  const metadata = createHomeMetadata("en", cmsHome("tr"));

  assert.equal(metadata.title, staticHomeSeo.en.title);
  assert.equal(metadata.alternates?.canonical, `${site}/en`);
});
