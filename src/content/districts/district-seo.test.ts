import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { getUiStrings } from "@/components/ui/strings";
import { fileURLToPath } from "node:url";
import { siteSocialImage } from "@/config/site";
import { verifiedDistrictImages } from "@/content/photos/verified-district-images";
import { metaDescriptionMaxLength, metaTitleMaxLength } from "@/lib/metadata";
import type { DistrictGuide } from "./district-guide-projection";
import { districts, type District } from "./district-registry";
import { districtWorkspaceCrumb } from "@/components/districts/district-breadcrumb";
import type { PublicPhoto } from "@/content/photos/types";
import {
  districtDirectorySocialImage,
  districtJsonLd,
  districtMetadata,
  getDistrictDirectoryShareCard,
  getDistrictShareCard,
  getDistrictTitle,
  isDistrictGuideIndexable,
} from "./district-seo";

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
    publishedAt: null,
    updatedAt: "2026-10-01T09:00:00.000Z",
    ...overrides,
  };
}

const editorial: {
  districts: Array<{ district: string; sections: { summary: string } }>;
} = JSON.parse(readFileSync("data/districts/editorial.json", "utf8"));

function district(slug: string): District {
  const match = districts.find((candidate) => candidate.slug === slug);
  assert.ok(match);
  return match;
}

test("39 district titles are unique and at most 60 characters", () => {
  const titles = districts.map(getDistrictTitle);

  assert.equal(new Set(titles).size, 39);
  for (const [index, title] of titles.entries()) {
    assert.ok(title.length <= metaTitleMaxLength, title);
    assert.ok(title.startsWith(districts[index]?.name ?? "?"), title);
    assert.equal(districtMetadata(districts[index], null).title, title);
  }
});

test("published summaries become descriptions of at most 160 characters", () => {
  assert.equal(editorial.districts.length, 39);
  for (const record of editorial.districts) {
    const current = district(record.district);
    const metadata = districtMetadata(
      current,
      guide({ summary: record.sections.summary }),
    );
    const description = metadata.description ?? "";

    assert.ok(description.length <= metaDescriptionMaxLength, description);
    assert.ok(description.startsWith(current.name), description);
    assert.equal(metadata.openGraph?.description, description);
    assert.equal(metadata.twitter?.description, description);
    const webPage = districtJsonLd(
      current,
      guide({ summary: record.sections.summary }),
    )["@graph"].find((node) => node["@type"] === "WebPage");
    assert.ok(webPage && "description" in webPage);
    assert.equal(webPage.description, description);
  }
});

test("a short summary is kept unchanged", () => {
  const summary =
    "Güngören, İstanbul’un en küçük yüzölçümlü ve en yoğun iç-kent ilçelerinden biridir.";
  assert.equal(
    districtMetadata(district("gungoren"), guide({ summary })).description,
    summary,
  );
});

test("district pages without an indexable guide are noindex, follow", () => {
  const esenler = district("esenler");

  assert.deepEqual(districtMetadata(esenler, null).robots, {
    index: false,
    follow: true,
  });
  // Published, but the content policy hides every narrative section.
  assert.deepEqual(
    districtMetadata(esenler, guide({ neighborhoods: [{ name: "Merkez" }] }))
      .robots,
    { index: false, follow: true },
  );
  assert.deepEqual(
    districtMetadata(esenler, guide({ history: "Tarih." })).robots,
    { index: true, follow: true },
  );
  assert.equal(isDistrictGuideIndexable(null), false);
  assert.equal(isDistrictGuideIndexable(guide()), false);
  assert.equal(isDistrictGuideIndexable(guide({ summary: "Özet." })), true);
});

test("district photos are shared through the optimizer, others use the generated card", () => {
  for (const current of districts) {
    const images = districtMetadata(current, null).openGraph?.images;
    const photo = verifiedDistrictImages[current.slug];

    if (photo === undefined) {
      assert.deepEqual(images, [
        {
          url: `https://www.sabandurali.com/istanbul/ilceler/${current.slug}/og.png`,
          alt: `${current.name} ilçe rehberi, Şaban Durali`,
          width: 1200,
          height: 630,
        },
      ]);
      assert.notDeepEqual(images, [siteSocialImage]);
      continue;
    }
    const width = Math.min(1200, photo.width);
    assert.deepEqual(images, [
      {
        url: `https://www.sabandurali.com/_next/image?url=${encodeURIComponent(photo.src)}&w=1200&q=75`,
        alt: photo.alt,
        width,
        height: Math.round((width * photo.height) / photo.width),
      },
    ]);
  }
  assert.ok(verifiedDistrictImages.esenler);
});

test("verified district image sizes match the files in public/", async () => {
  const { default: sharp } = await import("sharp");
  const publicDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../public",
  );

  for (const [slug, photo] of Object.entries(verifiedDistrictImages)) {
    const metadata = await sharp(
      path.join(publicDirectory, photo.src),
    ).metadata();
    // EXIF orientations 5–8 swap the displayed width and height.
    const swapped = (metadata.orientation ?? 1) >= 5;
    assert.deepEqual(
      { width: photo.width, height: photo.height },
      swapped
        ? { width: metadata.height, height: metadata.width }
        : { width: metadata.width, height: metadata.height },
      slug,
    );
  }
});

test("district metadata keeps canonical, Turkish-only hreflang and a large card", () => {
  const metadata = districtMetadata(
    district("kadikoy"),
    guide({ summary: "Kadıköy." }),
  );

  assert.equal(
    metadata.alternates?.canonical,
    "https://www.sabandurali.com/istanbul/ilceler/kadikoy",
  );
  // A Turkish-only page is in no hreflang cluster.
  assert.equal(metadata.alternates?.languages, undefined);
  assert.equal(
    metadata.twitter !== null &&
      metadata.twitter !== undefined &&
      "card" in metadata.twitter
      ? metadata.twitter.card
      : null,
    "summary_large_image",
  );
});

test("FRONTEND-6: the JSON-LD breadcrumb names home like the visible one", () => {
  const district = districts[0];
  assert.ok(district);
  const graph = districtJsonLd(district, null)["@graph"];
  const breadcrumb = graph.find(
    (node) => "@type" in node && node["@type"] === "BreadcrumbList",
  );
  assert.ok(breadcrumb && "itemListElement" in breadcrumb);
  const home = breadcrumb.itemListElement?.[0];
  assert.equal(home?.name, getUiStrings("tr").home);
  assert.equal(home?.name, "Ana sayfa");
});

test("CORRECTNESS-4: JSON-LD dateModified of a scheduled guide is its publication", () => {
  const district = districts[0];
  assert.ok(district);
  const webPage = (value: DistrictGuide | null) =>
    districtJsonLd(district, value)["@graph"].find(
      (node) => "@type" in node && node["@type"] === "WebPage",
    );
  const scheduled = webPage(
    guide({
      summary: "Özet.",
      updatedAt: "2026-09-01T09:00:00.000Z",
      publishedAt: "2026-09-15T06:00:00.000Z",
    }),
  );
  assert.ok(scheduled && "dateModified" in scheduled);
  assert.equal(scheduled.dateModified, "2026-09-15T06:00:00.000Z");
  const edited = webPage(
    guide({
      summary: "Özet.",
      updatedAt: "2026-09-20T09:00:00.000Z",
      publishedAt: "2026-09-15T06:00:00.000Z",
    }),
  );
  assert.ok(edited && "dateModified" in edited);
  assert.equal(edited.dateModified, "2026-09-20T09:00:00.000Z");
});

function districtPhoto(overrides: Partial<PublicPhoto> = {}): PublicPhoto {
  return {
    id: "photo-1",
    language: "tr",
    title: "Moda sahili",
    slug: "moda-sahili",
    description: null,
    image: {
      src: "/api/media/file/moda.jpg",
      alt: "Moda sahilinde akşam",
      width: 3000,
      height: 2000,
    },
    collections: [],
    tags: [],
    takenAt: null,
    locationName: null,
    district: "fatih",
    neighborhood: null,
    districtPhotoCategory: null,
    dayPeriod: null,
    photographer: "Şaban Durali",
    creditLicense: "Tüm hakları saklıdır",
    exif: {
      camera: null,
      lens: null,
      focalLength: null,
      aperture: null,
      shutterSpeed: null,
      iso: null,
    },
    featured: true,
    publishedAt: "2026-06-01T09:00:00.000Z",
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-06-01T09:00:00.000Z",
    seo: { title: "T", description: "D", openGraphImage: null },
    ...overrides,
  };
}

function graphNode(
  jsonLd: ReturnType<typeof districtJsonLd>,
  type: string,
): Record<string, unknown> | undefined {
  const node: unknown = jsonLd["@graph"].find(
    (candidate) => candidate["@type"] === type,
  );
  return typeof node === "object" && node !== null
    ? Object.fromEntries(Object.entries(node))
    : undefined;
}

test("DISTRICT-OG: without a verified image the page's CMS hero photo is shared", () => {
  const fatih = district("fatih");
  assert.equal(verifiedDistrictImages.fatih, undefined);
  const images = districtMetadata(fatih, null, [
    districtPhoto({ featured: false, id: "other", slug: "other" }),
    districtPhoto(),
  ]).openGraph?.images;

  assert.deepEqual(images, [
    {
      url: `https://www.sabandurali.com/_next/image?url=${encodeURIComponent("/api/media/file/moda.jpg")}&w=1200&q=75`,
      alt: "Moda sahilinde akşam",
      width: 1200,
      height: 800,
    },
  ]);
  // The verified image stays first when there is one.
  const esenler = districtMetadata(district("esenler"), null, [
    districtPhoto({ district: "esenler" }),
  ]).openGraph?.images;
  assert.match(JSON.stringify(esenler), /esenler\.jpg/);
});

test("DISTRICT-OG: the generated card names only the registry's side and name", () => {
  assert.deepEqual(getDistrictShareCard(district("kadikoy")), {
    eyebrow: "İSTANBUL · ANADOLU YAKASI",
    title: "Kadıköy",
    subtitle: "İlçe Rehberi",
  });
  assert.equal(
    getDistrictShareCard(district("sisli")).eyebrow,
    "İSTANBUL · AVRUPA YAKASI",
  );
});

test("DISTRICT-OG: the directory is shared with its own generated card", () => {
  assert.deepEqual(getDistrictDirectoryShareCard(), {
    eyebrow: "İSTANBUL",
    title: "İlçe Rehberi",
    subtitle: `${districts.length} ilçe için kaynak temelli rehberler`,
  });
  assert.equal(districts.length, 39);
  assert.deepEqual(districtDirectorySocialImage(), {
    url: "https://www.sabandurali.com/istanbul/ilceler/og.png",
    alt: "İstanbul ilçe rehberi, Şaban Durali",
    width: 1200,
    height: 630,
  });
  const route = readFileSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../app/(tr)/istanbul/ilceler/page.tsx",
    ),
    "utf8",
  );
  assert.match(route, /images: \[districtDirectorySocialImage\(\)\]/);
});

test("BREADCRUMB-JSONLD: the district trail uses the visible breadcrumb's names", () => {
  const breadcrumb = graphNode(
    districtJsonLd(district("kadikoy"), null),
    "BreadcrumbList",
  );
  assert.ok(breadcrumb);
  assert.deepEqual(breadcrumb.itemListElement, [
    {
      "@type": "ListItem",
      position: 1,
      name: getUiStrings("tr").home,
      item: "https://www.sabandurali.com/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: districtWorkspaceCrumb.label,
      item: `https://www.sabandurali.com${districtWorkspaceCrumb.href}`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "İlçeler",
      item: "https://www.sabandurali.com/istanbul/ilceler",
    },
    {
      "@type": "ListItem",
      position: 4,
      name: "Kadıköy",
      item: "https://www.sabandurali.com/istanbul/ilceler/kadikoy",
    },
  ]);
  // The last item is the page's canonical URL.
  assert.equal(
    districtMetadata(district("kadikoy"), null).alternates?.canonical,
    "https://www.sabandurali.com/istanbul/ilceler/kadikoy",
  );
});

test("DISTRICT-JSONLD: an indexable guide is an Article of the owner about the district", () => {
  const jsonLd = districtJsonLd(
    district("esenler"),
    guide({
      summary: "Esenler özeti.",
      publishedAt: "2026-09-15T06:00:00.000Z",
      updatedAt: "2026-09-20T09:00:00.000Z",
    }),
  );
  const article = graphNode(jsonLd, "Article");
  const place = graphNode(jsonLd, "AdministrativeArea");
  assert.ok(article && place);
  assert.equal(article.headline, "Esenler İlçe Rehberi");
  assert.equal(article.datePublished, "2026-09-15T06:00:00.000Z");
  assert.equal(article.dateModified, "2026-09-20T09:00:00.000Z");
  assert.deepEqual(article.author, {
    "@type": "Person",
    "@id": "https://www.sabandurali.com/#person",
    name: "Şaban Durali",
    url: "https://www.sabandurali.com/",
  });
  assert.deepEqual(article.about, { "@id": place["@id"] });
  assert.equal(place.name, "Esenler");
  assert.deepEqual(place.containedInPlace, {
    "@type": "AdministrativeArea",
    name: "İstanbul",
    containedInPlace: { "@type": "Country", name: "Türkiye" },
  });
  assert.equal("sameAs" in place, false);

  // The licensed verified image with its licence and record page.
  const image = verifiedDistrictImages.esenler;
  assert.ok(image);
  assert.deepEqual(article.image, {
    "@type": "ImageObject",
    contentUrl: "https://www.sabandurali.com/workspaces/districts/esenler.jpg",
    url: "https://www.sabandurali.com/workspaces/districts/esenler.jpg",
    caption: image.alt,
    width: image.width,
    height: image.height,
    creditText: image.credit,
    license: image.licenseUrl,
    acquireLicensePage: image.recordUrl,
  });
});

test("DISTRICT-JSONLD: a placeholder page claims no Article and no image it lacks", () => {
  const jsonLd = districtJsonLd(district("fatih"), null);
  assert.equal(graphNode(jsonLd, "Article"), undefined);
  assert.equal(graphNode(jsonLd, "WebPage")?.primaryImageOfPage, undefined);
  assert.ok(graphNode(jsonLd, "AdministrativeArea"));

  // A published guide whose every narrative section the content policy
  // withheld is still a placeholder: no Article either.
  const withheld = districtJsonLd(
    district("fatih"),
    guide({ publishedAt: "2026-09-01T09:00:00.000Z" }),
  );
  assert.equal(graphNode(withheld, "Article"), undefined);
});

test("DISTRICT-JSONLD: fields outside the public projection never reach the JSON-LD", () => {
  const leaked = {
    ...guide({ summary: "Fatih özeti.", history: "Tarih." }),
    researchNotes: "PRIVATE-RESEARCH-NOTE",
    internalNotes: "PRIVATE-INTERNAL-NOTE",
    marketData: {
      source: "PRIVATE-MARKET-SOURCE",
      description: "PRIVATE-MARKET-DATA",
    },
    sources: [
      {
        title: "PRIVATE-SOURCE-TITLE",
        url: "https://example.com/private",
      },
    ],
    facts: { population: "PRIVATE-FACT" },
  };
  const serialized = JSON.stringify(
    districtJsonLd(
      district("fatih"),
      // A guide object carrying extra keys, as a careless caller could pass.
      Object.assign(guide(), leaked),
      [districtPhoto()],
    ),
  );
  assert.doesNotMatch(serialized, /PRIVATE-/);
});

test("CITE-THIS: a published guide's metadata carries the citation tags of its page", () => {
  const metadata = districtMetadata(
    district("esenler"),
    guide({
      history: "Tarih.",
      publishedAt: "2026-09-12T22:30:00.000Z",
      updatedAt: "2026-09-27T11:00:00.000Z",
    }),
  );
  assert.deepEqual(metadata.other, {
    citation_title: "Esenler İlçe Rehberi",
    citation_author: ["Şaban Durali"],
    // 22:30 UTC on 12 September is 13 September in Istanbul.
    citation_publication_date: "2026/09/13",
    citation_online_date: "2026/09/13",
    citation_language: "tr",
    citation_public_url: "https://www.sabandurali.com/istanbul/ilceler/esenler",
  });
});

test("CITE-THIS: no guide, no citation tags; no publication date, no date tags", () => {
  assert.equal(districtMetadata(district("esenler"), null).other, undefined);
  const undated = districtMetadata(district("esenler"), guide()).other;
  assert.ok(undated);
  assert.equal(undated.citation_publication_date, undefined);
  assert.equal(undated.citation_online_date, undefined);
  assert.equal(undated.citation_title, "Esenler İlçe Rehberi");
});
