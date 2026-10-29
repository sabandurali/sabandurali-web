// Checked inputs and per-district checks of the content acceptance gate
// (`check-content.ts`). Every JSON file is narrowed by a type guard instead
// of a cast, and every failure names the district it belongs to, so a
// missing record fails with "<district>: …" instead of a TypeError.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mapDistrictGuide } from "../../src/content/districts/district-guide-projection";
import { isRecord } from "../../src/content/guards";
import { batch1PopulationFacts, type EditorialBundle } from "./editorial";
import {
  makeDraft,
  type ResearchBundle,
  type ResearchRecord,
} from "./import-core";

export type NeighbourhoodEvidence = {
  district: string;
  officialNames: string[];
  neighborhoodStatus: string;
};

export type HistoricalPhotoCandidate = {
  archive: string;
  recordUrl: string;
  rightsStatement: string;
  publicationSafe: boolean;
  license: string;
  requiredAttribution: string;
  currentDistrictMatch: "verified" | "probable" | "uncertain";
  notes: string;
};

export type HistoricalPhotoBundle = {
  schemaVersion: number;
  districts: Array<{
    district: string;
    candidates: HistoricalPhotoCandidate[];
    notes: string;
  }>;
};

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every(isString);
}

/** Optional text sections: absent or a string, never another type. */
function isOptionalStringRecord(value: unknown): boolean {
  return (
    isRecord(value) &&
    Object.values(value).every((item) => item === undefined || isString(item))
  );
}

function isSourceList(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (source) =>
        isRecord(source) &&
        isString(source.title) &&
        isString(source.publisher) &&
        isString(source.url) &&
        isString(source.sourceType) &&
        (source.sections === undefined ||
          source.sections === null ||
          isStringArray(source.sections)),
    )
  );
}

function isResearchRecord(value: unknown): value is ResearchRecord {
  return (
    isRecord(value) &&
    isString(value.district) &&
    isString(value.name) &&
    isRecord(value.document) &&
    isString(value.document.sha256) &&
    isStringRecord(value.sections) &&
    isSourceList(value.sources) &&
    isString(value.sourceAppendix) &&
    isStringArray(value.reviewedSections) &&
    typeof value.needsVerification === "boolean"
  );
}

/** The shape `validateBundle` and `makeDraft` rely on. */
export function isResearchBundle(value: unknown): value is ResearchBundle {
  return (
    isRecord(value) &&
    typeof value.schemaVersion === "number" &&
    isString(value.publicationStatus) &&
    Array.isArray(value.districts) &&
    value.districts.every(isResearchRecord)
  );
}

function isEditorialFacts(value: unknown): boolean {
  return (
    value === undefined ||
    (isRecord(value) &&
      isString(value.population) &&
      typeof value.populationYear === "number")
  );
}

/** The shape `attachEditorial` and the completeness checks rely on. */
export function isEditorialBundle(value: unknown): value is EditorialBundle {
  return (
    isRecord(value) &&
    value.schemaVersion === 1 &&
    Array.isArray(value.districts) &&
    value.districts.every(
      (row) =>
        isRecord(row) &&
        isString(row.district) &&
        isString(row.pdfSha256) &&
        isString(row.checkedAt) &&
        isString(row.methodology) &&
        isOptionalStringRecord(row.sections) &&
        isStringArray(row.neighborhoods) &&
        isSourceList(row.sources) &&
        isStringRecord(row.excluded) &&
        isEditorialFacts(row.facts),
    )
  );
}

export function isNeighbourhoodEvidence(
  value: unknown,
): value is NeighbourhoodEvidence[] {
  return (
    Array.isArray(value) &&
    value.every(
      (row) =>
        isRecord(row) &&
        isString(row.district) &&
        isString(row.neighborhoodStatus) &&
        isStringArray(row.officialNames),
    )
  );
}

const districtMatches: ReadonlyArray<unknown> = [
  "verified",
  "probable",
  "uncertain",
];

function isHistoricalPhotoCandidate(
  value: unknown,
): value is HistoricalPhotoCandidate {
  return (
    isRecord(value) &&
    isString(value.archive) &&
    isString(value.recordUrl) &&
    isString(value.rightsStatement) &&
    typeof value.publicationSafe === "boolean" &&
    isString(value.license) &&
    isString(value.requiredAttribution) &&
    districtMatches.includes(value.currentDistrictMatch) &&
    isString(value.notes)
  );
}

export function isHistoricalPhotoBundle(
  value: unknown,
): value is HistoricalPhotoBundle {
  return (
    isRecord(value) &&
    typeof value.schemaVersion === "number" &&
    Array.isArray(value.districts) &&
    value.districts.every(
      (row) =>
        isRecord(row) &&
        isString(row.district) &&
        isString(row.notes) &&
        Array.isArray(row.candidates) &&
        row.candidates.every(isHistoricalPhotoCandidate),
    )
  );
}

/** Reads a JSON file and fails with the file name when its shape is wrong. */
export function readCheckedJson<T>(
  path: string,
  guard: (value: unknown) => value is T,
): T {
  const value: unknown = JSON.parse(readFileSync(path, "utf8"));
  assert.ok(guard(value), `${path}: unexpected JSON shape`);
  return value;
}

/** Fails with the district name when a list has no row for it. */
export function requireDistrictRow<T extends { district: string }>(
  rows: readonly T[],
  district: string,
  label: string,
): T {
  const row = rows.find((item) => item.district === district);
  assert.ok(row, `${district}: ${label} record missing`);
  return row;
}

export type DistrictAcceptanceRow = {
  district: string;
  result: "PASS";
  verified: unknown;
  neighborhoods: number;
  sourceCount: number;
  excluded: Record<string, string>;
};

/**
 * The public projection of one research record with its attached editorial
 * review, checked against the reviewed official neighbourhood list.
 */
export function checkDistrictRecord(
  r: ResearchRecord,
  evidence: readonly NeighbourhoodEvidence[],
  expectedNeighbourhoodCount: number | undefined,
): DistrictAcceptanceRow {
  const review = r.editorial;
  assert.ok(review, `${r.district}: editorial review not attached`);
  const draft = makeDraft(r);
  const projected = mapDistrictGuide(draft);
  assert.ok(projected, `${r.district}: the draft does not project`);
  const proof = requireDistrictRow(evidence, r.district, "editorial-review");
  assert.equal(
    proof.neighborhoodStatus,
    "verified-current-directory",
    `${r.district}: neighbourhood status`,
  );
  assert.deepEqual(
    projected.neighborhoods.map((n) => n.name),
    proof.officialNames,
    `${r.district}: official neighbourhood names`,
  );
  assert.equal(
    projected.neighborhoods.length,
    expectedNeighbourhoodCount,
    r.district,
  );
  for (const section of ["summary", "history", "geography"] as const) {
    const value = projected[section];
    assert.ok(
      value && value === review.sections[section],
      `${r.district}/${section}: reviewed copy`,
    );
    assert.notEqual(value, r.sections[section], `${r.district}/${section}`);
    assert.ok(
      !/\b(?:TL|ADNKS)\b|%\s*\d|\d[.,]\d+\s*(?:m²|yıl|milyon)/.test(value),
      `${r.district}: volatile claim`,
    );
  }
  const expectedFacts = Object.entries(batch1PopulationFacts).find(
    ([district]) => district === r.district,
  )?.[1];
  if (review.facts) {
    assert.deepEqual(projected.facts, review.facts, `${r.district}/facts`);
  } else {
    assert.equal(projected.facts, null, `${r.district}/facts must be withheld`);
  }
  if (expectedFacts) {
    assert.equal(review.facts?.population, expectedFacts.population);
    assert.equal(review.facts?.populationYear, expectedFacts.populationYear);
    assert.ok(
      projected.sources.some(
        (source) =>
          source.publisher === "Türkiye İstatistik Kurumu" &&
          source.primary === true &&
          source.needsVerification === false &&
          source.sections?.includes("facts"),
      ),
      `${r.district}/facts TÜİK source`,
    );
    assert.ok(
      !/Nüfus|nüfus yılı/.test(review.excluded.facts ?? ""),
      `${r.district}/facts exclusion`,
    );
  }
  for (const field of [
    "transportation",
    "life",
    "housingTexture",
    "regionalAssessment",
    "placesGuide",
    "distinctiveFeatures",
    "researchTopics",
  ] as const) {
    const editorialValue: string | undefined = review.sections[field];
    if (editorialValue) {
      assert.equal(projected[field], editorialValue, `${r.district}/${field}`);
    } else {
      assert.equal(
        projected[field],
        null,
        `${r.district}/${field} must be withheld`,
      );
      assert.ok(review.excluded[field], `${r.district}/${field} exclusion`);
    }
  }
  assert.equal(projected.marketData, null, `${r.district}/marketData withheld`);
  assert.ok(review.excluded.marketData, `${r.district}/marketData exclusion`);
  assert.equal(
    projected.planningDevelopments.length,
    review.planningDevelopments?.length ?? 0,
    `${r.district}/planningDevelopments`,
  );
  const publicJSON = JSON.stringify(projected);
  assert.ok(
    !publicJSON.includes(r.sourceAppendix),
    `${r.district}: research appendix`,
  );
  assert.ok(
    !publicJSON.includes("importProvenance") &&
      !publicJSON.includes("researchNotes"),
    `${r.district}: private research fields`,
  );
  assert.ok(
    projected.sources.every((s) => s.needsVerification === false),
    `${r.district}: unverified source`,
  );
  assert.ok(
    review.methodology && Date.parse(review.checkedAt) <= Date.now(),
    `${r.district}: methodology and check date`,
  );
  return {
    district: r.district,
    result: "PASS",
    verified: draft.reviewedSections,
    neighborhoods: projected.neighborhoods.length,
    sourceCount: projected.sources.length,
    excluded: review.excluded,
  };
}
