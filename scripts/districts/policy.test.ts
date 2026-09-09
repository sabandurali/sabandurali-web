import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  districtSectionOptions,
  isPublicSourceUrl,
  sectionIsPublic,
  type DistrictSource,
} from "../../src/content/districts/district-content-policy";
import { mapDistrictGuide } from "../../src/content/districts/district-guide-projection";
import { districts } from "../../src/content/districts/district-registry";
import {
  decideImport,
  fingerprint,
  importVersion,
  researchFingerprint,
  makeDraft,
  validateBundle,
  type ResearchBundle,
} from "./import-core";
const now = Date.parse("2026-09-09T12:00:00Z");
const source: DistrictSource = {
  title: "Kaynak",
  publisher: "Esenler Kaymakamlığı",
  url: "https://www.esenler.gov.tr/tarihce",
  sourceType: "official",
  primary: true,
  checkedAt: "2026-09-09T10:00:00Z",
  dataDate: "2026-09-01T00:00:00Z",
  needsVerification: false,
  sections: districtSectionOptions.map((s) => s.value),
};
const bundle = JSON.parse(
  readFileSync("data/districts/research.json", "utf8"),
) as ResearchBundle;
test("39 registry districts, PDF fingerprints, all nine research sections and unique slugs", () => {
  validateBundle(bundle);
  assert.equal(new Set(districts.map((d) => d.slug)).size, 39);
  assert.equal(
    new Set(bundle.districts.map((d) => d.document.sha256)).size,
    39,
  );
  for (const row of bundle.districts)
    assert.equal(Object.keys(row.sections).length, 9);
});
test("duplicate/unknown district fails before any DB connection", () => {
  const bad = structuredClone(bundle);
  bad.districts[1] = bad.districts[0];
  assert.throws(() => validateBundle(bad));
});
test("all 39 raw imports are drafts and have no public content", () => {
  for (const row of bundle.districts) {
    const data = makeDraft(row);
    assert.equal(data._status, "draft");
    const projected = mapDistrictGuide(data, now)!;
    assert.equal(projected.history, null);
    assert.equal(projected.marketData, null);
    assert.deepEqual(projected.sources, []);
    assert.equal("researchNotes" in projected, false);
    assert.equal("importProvenance" in projected, false);
  }
});
test("idempotency and manual changes including nested source edits", () => {
  const row = bundle.districts[0];
  const data = makeDraft(row) as Record<string, unknown>;
  assert.equal(decideImport(undefined, row).action, "create");
  data.importProvenance = {
    ...row.document,
    version: importVersion,
    sourceFingerprint: researchFingerprint(row),
    fingerprint: fingerprint(data),
  };
  assert.equal(decideImport(data, row).reason, "unchanged source");
  const revised = structuredClone(row);
  revised.document.sha256 = "a".repeat(64);
  assert.equal(decideImport(data, revised).action, "update");
  data.history = "Elle düzenlenmiş metin";
  assert.equal(
    decideImport(data, revised).reason,
    "manual/unmanaged content protected",
  );
});
test("section approval alone is not source verification", () => {
  assert.equal(sectionIsPublic("history", ["history"], [source], now), true);
  assert.equal(sectionIsPublic("history", [], [source], now), false);
  for (const patch of [
    { needsVerification: true },
    { checkedAt: null },
    { checkedAt: "2027-01-01" },
    { sourceType: "unclassified" as const },
    { url: "https://nufusune.com/esenler" },
  ])
    assert.equal(
      sectionIsPublic("history", ["history"], [{ ...source, ...patch }], now),
      false,
    );
});
test("no javascript/data URLs, embedded credentials or malformed links", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,x",
    "https://user:secret@domain.com",
    "not-a-url",
  ])
    assert.equal(isPublicSourceUrl(url), false);
});
test("periodic facts need dates and primary official evidence", () => {
  for (const patch of [
    { dataDate: null },
    { primary: false },
    { sourceType: "secondary" as const },
  ])
    assert.equal(
      sectionIsPublic("facts", ["facts"], [{ ...source, ...patch }], now),
      false,
    );
});
test("dynamic expiry, row URL mismatch, flagged rows and idempotent public projection", () => {
  const data = {
    reviewedSections: ["marketData", "planningDevelopments"],
    sources: [source],
    marketData: {
      salePricePerM2: 123,
      sourceUrl: source.url,
      dataDate: source.dataDate,
      checkedAt: source.checkedAt,
      needsVerification: false,
    },
    planningDevelopments: [
      {
        title: "Fixture",
        date: source.dataDate,
        checkedAt: source.checkedAt,
        officialSource: source.url,
        needsVerification: false,
      },
    ],
  };
  const projected = mapDistrictGuide(data, now)!;
  assert.equal(projected.marketData?.salePricePerM2, 123);
  assert.equal(projected.planningDevelopments.length, 1);
  assert.deepEqual(mapDistrictGuide({ ...data, ...projected }, now), projected);
  assert.equal(mapDistrictGuide(data, now + 100 * 86400000)!.marketData, null);
  data.marketData.sourceUrl = "https://example.org/other";
  assert.equal(mapDistrictGuide(data, now)!.marketData, null);
  data.planningDevelopments[0].needsVerification = true;
  assert.equal(mapDistrictGuide(data, now)!.planningDevelopments.length, 0);
});
