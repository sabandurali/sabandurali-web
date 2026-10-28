import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { siteSocialImage } from "@/config/site";
import { verifiedDistrictImages } from "@/content/photos/verified-district-images";
import { metaDescriptionMaxLength, metaTitleMaxLength } from "@/lib/metadata";
import type { DistrictGuide } from "./district-guide-projection";
import { districts, type District } from "./district-registry";
import {
  districtJsonLd,
  districtMetadata,
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
    assert.equal(
      districtJsonLd(current, guide({ summary: record.sections.summary }))[
        "@graph"
      ][1]?.description,
      description,
    );
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

test("district photos are shared through the optimizer, others use the site image", () => {
  for (const current of districts) {
    const images = districtMetadata(current, null).openGraph?.images;
    const photo = verifiedDistrictImages[current.slug];

    if (photo === undefined) {
      assert.deepEqual(images, [siteSocialImage]);
      continue;
    }
    assert.deepEqual(images, [
      {
        url: `https://www.sabandurali.com/_next/image?url=${encodeURIComponent(photo.src)}&w=1200&q=75`,
        alt: photo.alt,
      },
    ]);
  }
  assert.ok(verifiedDistrictImages.esenler);
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
  assert.deepEqual(metadata.alternates?.languages, {
    "tr-TR": "https://www.sabandurali.com/istanbul/ilceler/kadikoy",
  });
  assert.equal(
    metadata.twitter !== null &&
      metadata.twitter !== undefined &&
      "card" in metadata.twitter
      ? metadata.twitter.card
      : null,
    "summary_large_image",
  );
});
