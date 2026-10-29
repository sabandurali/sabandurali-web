import assert from "node:assert/strict";
import test from "node:test";
import { personEntityId } from "@/content/entity-seo";
import {
  createPhotoJsonLd,
  createPhotoMetadata,
  serializePhotoJsonLd,
} from "./photo-seo";
import type { PublicPhoto } from "./types";

const site = "https://www.sabandurali.com";

function photo(overrides: Partial<PublicPhoto> = {}): PublicPhoto {
  return {
    id: "photo-1",
    language: "tr",
    title: "Galata",
    slug: "galata",
    description: null,
    image: {
      src: "/api/media/file/galata.jpg",
      alt: "Galata Kulesi",
      width: 6000,
      height: 4000,
    },
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
    seo: {
      title: "Galata | Şaban Durali",
      description: "Galata",
      openGraphImage: null,
    },
    ...overrides,
  };
}

test("the original photograph is shared through the image optimizer", () => {
  const metadata = createPhotoMetadata(photo(), {
    id: "photo-1",
    language: "en",
    title: "Galata",
    slug: "galata-tower",
  });
  const images = [
    {
      url: `${site}/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fgalata.jpg&w=1200&q=75`,
      alt: "Galata Kulesi",
      width: 1200,
      height: 800,
    },
  ];

  assert.deepEqual(metadata.alternates, {
    canonical: `${site}/fotograflar/galata`,
    languages: {
      "tr-TR": `${site}/fotograflar/galata`,
      en: `${site}/en/photography/galata-tower`,
      "x-default": `${site}/fotograflar/galata`,
    },
  });
  assert.deepEqual(metadata.robots, { index: true, follow: true });
  assert.deepEqual(metadata.openGraph, {
    title: "Galata | Şaban Durali",
    description: "Galata",
    url: `${site}/fotograflar/galata`,
    siteName: "Şaban Durali",
    locale: "tr_TR",
    alternateLocale: ["en_US"],
    images,
    type: "article",
    publishedTime: "2026-06-01T09:00:00.000Z",
    modifiedTime: "2026-06-03T09:00:00.000Z",
    authors: ["Şaban Durali"],
  });
  assert.deepEqual(metadata.twitter, {
    card: "summary_large_image",
    title: "Galata | Şaban Durali",
    description: "Galata",
    images,
  });
});

test("an explicit share image is used as uploaded", () => {
  const metadata = createPhotoMetadata(
    photo({
      seo: {
        title: "T",
        description: "D",
        openGraphImage: {
          src: "https://store.public.blob.vercel-storage.com/share.jpg",
          alt: "Paylaşım",
          width: 1200,
          height: 630,
        },
      },
    }),
    null,
  );

  assert.deepEqual(metadata.twitter?.images, [
    {
      url: "https://store.public.blob.vercel-storage.com/share.jpg",
      alt: "Paylaşım",
      width: 1200,
      height: 630,
    },
  ]);
  assert.deepEqual(metadata.alternates?.languages, {
    "tr-TR": `${site}/fotograflar/galata`,
  });
});

test("a scheduled photo never reports a modification before publication", () => {
  const openGraph = createPhotoMetadata(
    photo({
      publishedAt: "2026-10-10T09:00:00.000Z",
      updatedAt: "2026-10-01T09:00:00.000Z",
    }),
    null,
  ).openGraph;

  assert.ok(openGraph && "modifiedTime" in openGraph);
  assert.equal(openGraph.modifiedTime, "2026-10-10T09:00:00.000Z");
});

test("SEO-PERF-3: a photo page describes the photograph as an ImageObject", () => {
  const jsonLd = createPhotoJsonLd(
    photo({ creditLicense: "Tüm hakları saklıdır" }),
  );

  assert.deepEqual(JSON.parse(JSON.stringify(jsonLd)), {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "@id": `${site}/fotograflar/galata#image`,
    url: `${site}/fotograflar/galata`,
    contentUrl: `${site}/api/media/file/galata.jpg`,
    name: "Galata",
    description: "Galata",
    caption: "Galata Kulesi",
    width: 6000,
    height: 4000,
    creator: {
      "@type": "Person",
      "@id": personEntityId,
      name: "Şaban Durali",
      url: `${site}/`,
    },
    creditText: "Şaban Durali",
    copyrightNotice: "Tüm hakları saklıdır",
    datePublished: "2026-06-01T09:00:00.000Z",
    dateModified: "2026-06-03T09:00:00.000Z",
    inLanguage: "tr-TR",
  });
});

test("SEO-PERF-3: another creator is named as given and no licence is guessed", () => {
  const jsonLd = createPhotoJsonLd(
    photo({
      language: "en",
      slug: "galata-1930",
      description: "Galata in the 1930s",
      photographer: "Bilinmiyor",
      creditLicense: null,
      image: {
        src: "https://store.public.blob.vercel-storage.com/galata.jpg",
        alt: "Galata",
      },
    }),
  );

  // An unknown creator is credited as entered, never typed as a person.
  assert.equal(jsonLd.creator, undefined);
  assert.equal(jsonLd.creditText, "Bilinmiyor");
  assert.equal(jsonLd.copyrightNotice, undefined);
  assert.equal(
    jsonLd.contentUrl,
    "https://store.public.blob.vercel-storage.com/galata.jpg",
  );
  assert.equal(jsonLd.url, `${site}/en/photography/galata-1930`);
  assert.equal(jsonLd.description, "Galata in the 1930s");
  assert.equal(jsonLd.inLanguage, "en");
  assert.equal("license" in jsonLd, false);
  assert.equal("acquireLicensePage" in jsonLd, false);
});

test("SEO-PERF-3: a named photographer is the creator Person", () => {
  const jsonLd = createPhotoJsonLd(photo({ photographer: "Ayşe Yılmaz" }));

  assert.deepEqual(jsonLd.creator, { "@type": "Person", name: "Ayşe Yılmaz" });
  assert.equal(jsonLd.creditText, "Ayşe Yılmaz");
});

test("SEO-PERF-3: a historical photo is credited with its attribution, not as a Person", () => {
  const attribution =
    "Abdullah Frères · Library of Congress / Wikimedia Commons · Public domain";
  const jsonLd = createPhotoJsonLd(
    photo({
      districtPhotoCategory: "tarih",
      photographer: "Abdullah Frères",
      creditLicense: attribution,
    }),
  );

  assert.equal(jsonLd.creator, undefined);
  assert.equal(jsonLd.creditText, attribution);
  assert.equal(jsonLd.copyrightNotice, attribution);
});

test("SEO-PERF-3: serialized photo JSON-LD cannot close the script element", () => {
  assert.ok(
    !serializePhotoJsonLd(photo({ title: "</script><b>" })).includes("</"),
  );
});
