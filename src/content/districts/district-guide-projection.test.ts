import assert from "node:assert/strict";
import test from "node:test";
import type { DistrictSource } from "./district-content-policy";
import {
  mapDistrictGuide,
  projectPublicDistrictGuideDocument,
  projectPublishedDistrictGuide,
  PUBLIC_DISTRICT_GUIDE_DOCUMENT_KEYS,
} from "./district-guide-projection";

const now = Date.parse("2026-09-13T12:00:00Z");
const source: DistrictSource & Record<string, unknown> = {
  id: "source-row-1",
  title: "Kontrol edilmiş resmî kaynak",
  publisher: "T.C. Esenler Kaymakamlığı",
  url: "https://www.esenler.gov.tr/tarihce",
  sourceType: "official",
  primary: true,
  dataDate: "2026-09-01T00:00:00Z",
  checkedAt: "2026-09-13T00:00:00Z",
  needsVerification: false,
  sections: ["summary", "history", "facts", "marketData", "neighborhoods"],
  note: "PRIVATE-SOURCE-NOTE",
};

// A stored document with private and future fields next to public ones.
const stored = {
  id: "guide-1",
  district: "esenler",
  _status: "published",
  publishedAt: "2026-09-13T10:00:00Z",
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-13T11:00:00Z",
  reviewedSections: ["summary", "history", "facts", "marketData", "life"],
  sources: [source],
  summary: "Doğrulanmış özet",
  history: "Doğrulanmış tarihçe",
  life: "Kaynağı olmayan yaşam metni",
  geography: "İncelenmemiş coğrafya",
  facts: {
    population: "419878",
    populationYear: 2025,
    areaKm2: 18.43,
    internalNote: "PRIVATE-FACT-NOTE",
  },
  marketData: {
    salePricePerM2: 123,
    sourceUrl: source.url,
    dataDate: source.dataDate,
    checkedAt: source.checkedAt,
    needsVerification: false,
    verifierComment: "PRIVATE-MARKET-COMMENT",
  },
  neighborhoods: [{ id: "n1", name: "Örnek", image: "media-secret-id" }],
  researchNotes: "PRIVATE-RESEARCH-NOTES",
  importProvenance: { pdfSha256: "PRIVATE-PROVENANCE" },
  internalComment: "PRIVATE-FUTURE-FIELD",
};

test("the anonymous document is an explicit allowlist", () => {
  const projected = projectPublicDistrictGuideDocument(stored, now);

  assert.deepEqual(
    Object.keys(projected).sort(),
    [...PUBLIC_DISTRICT_GUIDE_DOCUMENT_KEYS].sort(),
  );
  const serialized = JSON.stringify(projected);
  for (const secret of [
    "PRIVATE-SOURCE-NOTE",
    "source-row-1",
    "PRIVATE-FACT-NOTE",
    "PRIVATE-MARKET-COMMENT",
    "media-secret-id",
    "PRIVATE-RESEARCH-NOTES",
    "PRIVATE-PROVENANCE",
    "PRIVATE-FUTURE-FIELD",
  ]) {
    assert.equal(serialized.includes(secret), false, secret);
  }
});

test("facts, market data and sources are copied field by field", () => {
  const guide = mapDistrictGuide(stored, now);

  assert.deepEqual(guide?.facts, {
    population: "419878",
    populationYear: 2025,
    areaKm2: 18.43,
  });
  assert.deepEqual(guide?.marketData, {
    salePricePerM2: 123,
    sourceUrl: source.url,
    dataDate: source.dataDate,
    checkedAt: source.checkedAt,
    needsVerification: false,
  });
  assert.deepEqual(guide?.sources, [
    {
      title: source.title,
      publisher: source.publisher,
      url: source.url,
      sourceType: "official",
      primary: true,
      dataDate: source.dataDate,
      checkedAt: source.checkedAt,
      needsVerification: false,
      sections: ["summary", "history", "facts", "marketData"],
    },
  ]);
  assert.equal(guide?.life, null, "reviewed but unsupported by a source");
  assert.equal(guide?.geography, null, "supported but not reviewed");
});

test("reviewed sections are reduced to the public ones and re-projection is stable", () => {
  const projected = projectPublicDistrictGuideDocument(stored, now);

  assert.deepEqual(projected.reviewedSections, [
    "summary",
    "history",
    "facts",
    "marketData",
  ]);
  assert.deepEqual(
    projectPublishedDistrictGuide(projected, now),
    projectPublishedDistrictGuide(stored, now),
  );
});

test("malformed values are dropped instead of crashing the projection", () => {
  const guide = mapDistrictGuide(
    {
      ...stored,
      facts: { population: 419878, populationYear: "2025", areaKm2: null },
      sources: [
        { ...source, title: 42 },
        { ...source, url: "https://other.gov.tr/x", sourceType: "blog" },
        "not-a-source",
      ],
    },
    now,
  );

  assert.ok(guide);
  assert.deepEqual(guide.sources, []);
  assert.equal(guide.summary, null);
  assert.equal(guide.facts, null);
  assert.deepEqual(
    mapDistrictGuide(
      {
        ...stored,
        facts: { population: 1, populationYear: "x", areaKm2: null },
      },
      now,
    )?.facts,
    { areaKm2: null },
  );
  assert.deepEqual(projectPublicDistrictGuideDocument(null, now), {});
});

/*
 * Market data is published only when both the source record and the row
 * pass the content policy. Each case below breaks exactly one of them. The
 * first case keeps the section public through another fresh source, so only
 * the separate check of the row's own source record (`marketSource`) rejects
 * it: `freshRow` replaces the source dates with the row dates.
 */
const staleMarketSource = {
  ...source,
  url: "https://www.esenler.gov.tr/eski-piyasa",
  dataDate: "2026-01-01T00:00:00Z",
  checkedAt: "2026-01-02T00:00:00Z",
};
const rejectedMarketCases: ReadonlyArray<{
  name: string;
  sources: Array<DistrictSource & Record<string, unknown>>;
  marketData?: Record<string, unknown>;
}> = [
  {
    name: "the row's own source record is stale while the row is fresh",
    sources: [source, staleMarketSource],
    marketData: { ...stored.marketData, sourceUrl: staleMarketSource.url },
  },
  {
    name: "the source's own data date is stale while the row is fresh",
    sources: [{ ...source, dataDate: "2026-01-01T00:00:00Z" }],
  },
  {
    name: "the source's own check date is stale while the row is fresh",
    sources: [{ ...source, checkedAt: "2026-01-01T00:00:00Z" }],
  },
  {
    name: "the source still needs verification",
    sources: [{ ...source, needsVerification: true }],
  },
  {
    name: "the source does not list marketData",
    sources: [{ ...source, sections: ["summary", "history", "facts"] }],
  },
  {
    name: "the row's sourceUrl matches no source",
    sources: [source],
    marketData: {
      ...stored.marketData,
      sourceUrl: "https://www.esenler.gov.tr/baska-sayfa",
    },
  },
  {
    name: "the row still needs verification",
    sources: [source],
    marketData: { ...stored.marketData, needsVerification: true },
  },
  {
    name: "the row's own data date is stale",
    sources: [source],
    marketData: { ...stored.marketData, dataDate: "2026-01-01T00:00:00Z" },
  },
];

for (const { name, sources, marketData } of rejectedMarketCases) {
  test(`market data is rejected when ${name}`, () => {
    const document = {
      ...stored,
      sources,
      marketData: marketData ?? stored.marketData,
    };

    assert.equal(mapDistrictGuide(document, now)?.marketData, null);
    const projected = projectPublicDistrictGuideDocument(document, now);
    assert.equal(projected.marketData, null);
    assert.equal(JSON.stringify(projected).includes("salePricePerM2"), false);
    assert.equal(
      Array.isArray(projected.reviewedSections) &&
        projected.reviewedSections.includes("marketData"),
      false,
      "no public section claims market data",
    );
    assert.equal(
      JSON.stringify(projected.sources).includes("marketData"),
      false,
      "no public source claims to back rejected market data",
    );
  });
}

test("a source lists planning only for a published planning row", () => {
  const planningSource = {
    ...source,
    url: "https://www.esenler.bel.tr/imar",
    sections: ["planningDevelopments" as const],
  };
  const row = {
    title: "Tamamlanan düzenleme",
    status: "tamamlandi",
    date: "2026-09-01T00:00:00Z",
    checkedAt: "2026-09-13T00:00:00Z",
    officialSource: planningSource.url,
    needsVerification: false,
  };
  const document = {
    ...stored,
    reviewedSections: [...stored.reviewedSections, "planningDevelopments"],
    sources: [source, planningSource],
  };

  const published = mapDistrictGuide(
    { ...document, planningDevelopments: [row] },
    now,
  );
  assert.equal(published?.planningDevelopments.length, 1);
  assert.deepEqual(
    published?.sources.find(({ url }) => url === planningSource.url)?.sections,
    ["planningDevelopments"],
  );

  const rejected = projectPublicDistrictGuideDocument(
    {
      ...document,
      planningDevelopments: [{ ...row, needsVerification: true }],
    },
    now,
  );
  assert.deepEqual(rejected.planningDevelopments, []);
  assert.equal(
    JSON.stringify(rejected.sources).includes(planningSource.url),
    false,
  );
  assert.equal(
    Array.isArray(rejected.reviewedSections) &&
      rejected.reviewedSections.includes("planningDevelopments"),
    false,
  );
});
