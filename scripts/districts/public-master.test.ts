import assert from "node:assert/strict";
import test from "node:test";
import {
  mapDistrictGuide,
  projectPublishedDistrictGuide,
} from "../../src/content/districts/district-guide-projection";
import type { DistrictSource } from "../../src/content/districts/district-content-policy";
import {
  districtJsonLd,
  districtMetadata,
} from "../../src/content/districts/district-seo";
import { getDistrict } from "../../src/content/districts/district-registry";

const now = Date.parse("2026-09-13T12:00:00Z");
const source: DistrictSource = {
  title: "Kontrol edilmiş resmî kaynak",
  publisher: "T.C. Esenler Kaymakamlığı",
  url: "https://www.esenler.gov.tr/tarihce",
  sourceType: "official",
  primary: true,
  dataDate: "2026-09-01T00:00:00Z",
  checkedAt: "2026-09-13T00:00:00Z",
  needsVerification: false,
  sections: [
    "summary",
    "history",
    "geography",
    "life",
    "transportation",
    "facts",
    "neighborhoods",
    "housingTexture",
    "regionalAssessment",
    "marketData",
    "planningDevelopments",
    "placesGuide",
    "distinctiveFeatures",
    "researchTopics",
  ],
};
const published = {
  _status: "published",
  publishedAt: "2026-09-13T10:00:00Z",
  reviewedSections: source.sections,
  sources: [source],
  summary: "Doğrulanmış özet",
  history: "Doğrulanmış tarihçe",
  geography: "Doğrulanmış coğrafya",
  life: "Doğrulanmış yaşam",
  transportation: "Doğrulanmış ulaşım",
  facts: { population: "1", populationYear: 2026 },
  neighborhoods: [{ name: "Örnek Mahalle" }],
  housingTexture: "Doğrulanmış yapı dokusu",
  regionalAssessment: "Doğrulanmış bölgesel değerlendirme",
  placesGuide: "Doğrulanmış yerler",
  distinctiveFeatures: "Doğrulanmış özellikler",
  researchTopics: "Doğrulanmış araştırma konusu",
  updatedAt: "2026-09-13T11:00:00Z",
  researchNotes: "PRIVATE-METADATA-MUST-NOT-LEAK",
};

test("draft and future records cannot become a public page projection", () => {
  assert.equal(
    projectPublishedDistrictGuide({ ...published, _status: "draft" }, now),
    null,
  );
  assert.equal(
    projectPublishedDistrictGuide(
      { ...published, publishedAt: "2026-09-14T00:00:00Z" },
      now,
    ),
    null,
  );
});

test("review and source gates both apply to public fields", () => {
  const withoutSource = mapDistrictGuide(
    { ...published, sources: [], reviewedSections: ["history"] },
    now,
  );
  const withoutReview = mapDistrictGuide(
    { ...published, reviewedSections: [], sources: [source] },
    now,
  );
  assert.equal(withoutSource?.history, null);
  assert.equal(withoutReview?.history, null);
  const partiallyReviewed = mapDistrictGuide(
    {
      ...published,
      reviewedSections: ["history"],
      sources: [{ ...source, sections: ["history", "life"] }],
    },
    now,
  );
  assert.deepEqual(partiallyReviewed?.sources[0]?.sections, ["history"]);
});

test("unverified market and planning rows remain private", () => {
  const projected = projectPublishedDistrictGuide(
    {
      ...published,
      marketData: {
        salePricePerM2: 123,
        sourceUrl: source.url,
        dataDate: source.dataDate,
        checkedAt: source.checkedAt,
        needsVerification: true,
      },
      planningDevelopments: [
        {
          title: "Doğrulanmamış plan",
          officialSource: source.url,
          date: source.dataDate,
          checkedAt: source.checkedAt,
          needsVerification: true,
        },
      ],
    },
    now,
  );
  assert.equal(projected?.marketData, null);
  assert.deepEqual(projected?.planningDevelopments, []);
});

test("stale dynamic sources cannot expose planning rows", () => {
  const staleSource = {
    ...source,
    dataDate: "2026-01-01T00:00:00Z",
    checkedAt: "2026-01-02T00:00:00Z",
  };
  const projected = projectPublishedDistrictGuide(
    {
      ...published,
      sources: [staleSource],
      planningDevelopments: [
        {
          title: "Tarihi geçmiş plan",
          officialSource: staleSource.url,
          date: staleSource.dataDate,
          checkedAt: staleSource.checkedAt,
          needsVerification: false,
        },
      ],
    },
    now,
  );
  assert.deepEqual(projected?.planningDevelopments, []);
});

test("valid sections pass without exposing private metadata", () => {
  const projected = projectPublishedDistrictGuide(published, now);
  assert.equal(projected?.summary, published.summary);
  assert.equal(projected?.history, published.history);
  assert.equal(projected?.neighborhoods.length, 1);
  assert.equal("researchNotes" in projected!, false);
  assert.doesNotMatch(
    JSON.stringify(projected),
    /PRIVATE-METADATA-MUST-NOT-LEAK/,
  );
});

test("SEO uses only the public projection", () => {
  const district = getDistrict("esenler")!;
  const projected = projectPublishedDistrictGuide(published, now)!;
  const metadata = districtMetadata(district, projected);
  const jsonLd = districtJsonLd(district, projected);
  const serialized = JSON.stringify({ metadata, jsonLd });
  assert.equal(
    metadata.alternates?.canonical,
    "https://www.sabandurali.com/istanbul/ilceler/esenler",
  );
  assert.match(serialized, /BreadcrumbList/);
  assert.match(serialized, /WebPage/);
  assert.match(serialized, /Place/);
  assert.doesNotMatch(
    serialized,
    /PRIVATE-METADATA-MUST-NOT-LEAK|researchNotes/,
  );
});
