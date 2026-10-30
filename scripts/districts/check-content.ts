// District content acceptance check (`npm run test:districts:content`). It
// never writes by default; `--report <path>` writes the JSON result, as
// `npm run report:districts:content` does.
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import {
  checkDistrictRecord,
  contentReferenceTime,
  isEditorialBundle,
  isHistoricalPhotoBundle,
  isNeighbourhoodEvidence,
  isResearchBundle,
  readCheckedJson,
  requireDistrictRow,
} from "./content-acceptance";
import {
  assertBatch1PopulationImportPlan,
  attachEditorial,
  batch1PopulationPlan,
} from "./editorial";
import { validateBundle } from "./import-core";
import { sourceKindFitsSection } from "../../src/content/districts/district-content-policy";

const { values: options } = parseArgs({
  options: { report: { type: "string" } },
  strict: true,
});
// Reviewed official neighbourhood lists (moved from reports/istanbul-39/ by
// ARC-12, see reports/README.md).
const editorialReviewPath = "data/districts/editorial-review.json";

const research = readCheckedJson(
  "data/districts/research.json",
  isResearchBundle,
);
const editorial = readCheckedJson(
  "data/districts/editorial.json",
  isEditorialBundle,
);
const historicalPhotos = readCheckedJson(
  "data/districts/historical-photo-candidates.json",
  isHistoricalPhotoBundle,
);
const evidence = readCheckedJson(editorialReviewPath, isNeighbourhoodEvidence);
const expectedCounts = [
  38, 10, 22, 11, 15, 10, 11, 23, 10, 45, 24, 39, 19, 43, 29, 57, 16, 11, 19,
  21, 38, 35, 15, 25, 13, 5, 17, 45, 21, 21, 20, 18, 36, 19, 15, 62, 17, 35, 33,
];
// Deterministic: the content policy is evaluated at the latest recorded
// review, not at the wall clock, so the result of a commit never changes with
// the date (TESTS-INFRA-1). A review dated in the future is still rejected;
// that comparison can only turn from failing to passing as time goes by.
const referenceTime = contentReferenceTime(editorial);
assert.ok(
  referenceTime <= Date.now(),
  "editorial.json: a checkedAt lies in the future",
);
validateBundle(research);
attachEditorial(research, editorial, referenceTime);
const rows = research.districts.map((r, i) =>
  checkDistrictRecord(r, evidence, expectedCounts[i], referenceTime),
);

const completedFields = [
  "life",
  "transportation",
  "housingTexture",
  "regionalAssessment",
  "placesGuide",
  "distinctiveFeatures",
  "researchTopics",
] as const;
const nonEsenler = editorial.districts.filter(
  (district) => district.district !== "esenler",
);
const requiredEditorialFields = [
  "summary",
  "history",
  "geography",
  "life",
  "transportation",
  "housingTexture",
  "regionalAssessment",
  "placesGuide",
  "distinctiveFeatures",
  "researchTopics",
] as const;
for (const district of nonEsenler) {
  const facts = district.facts;
  assert.ok(facts, `${district.district}: facts required`);
  assert.ok(facts.population?.trim(), `${district.district}: population`);
  assert.ok(
    Number.isInteger(facts.populationYear) && facts.populationYear > 0,
    `${district.district}: populationYear`,
  );
  assert.ok(
    typeof facts.areaKm2 === "number" &&
      Number.isFinite(facts.areaKm2) &&
      facts.areaKm2 > 0,
    `${district.district}: areaKm2`,
  );
  assert.equal(
    facts.neighborhoodCount,
    district.neighborhoods.length,
    `${district.district}: neighborhoodCount`,
  );
  assert.ok(
    facts.neighboringDistricts?.trim(),
    `${district.district}: neighboringDistricts`,
  );
  assert.ok(
    facts.locationSummary?.trim(),
    `${district.district}: locationSummary`,
  );
  assert.ok(
    district.sources.some(
      (source) =>
        source.url ===
          "https://ibb.istanbul/ibb/belediye-hakkinda/yetki-alani/" &&
        source.sourceType === "official" &&
        source.needsVerification === false &&
        source.sections?.includes("facts"),
    ),
    `${district.district}: official IBB area source`,
  );
  assert.ok(
    district.sources.some(
      (source) =>
        source.sourceType === "official" &&
        source.needsVerification === false &&
        source.sections?.includes("geography") &&
        source.sections.includes("facts"),
    ),
    `${district.district}: official neighboring-district source`,
  );
  for (const field of requiredEditorialFields) {
    const value = district.sections[field]?.trim();
    assert.ok(value, `${district.district}/${field}: required`);
    assert.ok(
      !/…|\.{3}/.test(value),
      `${district.district}/${field}: ellipsis or truncated copy`,
    );
  }
  const researchTopics = district.sections.researchTopics ?? "";
  const topics = researchTopics
    .split("\n")
    .map((topic) => topic.trim())
    .filter(Boolean);
  assert.ok(
    topics.length >= 3 && topics.length <= 5,
    `${district.district}/researchTopics: 3–5 topics required`,
  );
  assert.ok(
    topics.every((topic) => topic.startsWith("• ") && topic.length > 3),
    `${district.district}/researchTopics: clean bullet format`,
  );
  assert.ok(
    !/Araştırma Teması|Temel Sorunsal|\[cite:|\b(?:Sütun|Kolon)\b/i.test(
      researchTopics,
    ),
    `${district.district}/researchTopics: research artifact`,
  );
}
// A source may only claim sections its kind can support: a population
// register release never backs history, life or places copy. Adopted
// records keep the fingerprint the owner approved; their extra claims are
// withheld by the same policy at projection time until a re-adoption.
for (const district of editorial.districts) {
  if (district.adoption) continue;
  for (const source of district.sources)
    for (const section of source.sections ?? [])
      assert.ok(
        sourceKindFitsSection(source, section),
        `${district.district}: ${source.title} cannot support ${section}`,
      );
}
for (const field of completedFields) {
  // Presence per district is asserted above with the district name.
  const values = nonEsenler.map(
    (district) => district.sections[field]?.trim() ?? "",
  );
  assert.ok(values.every(Boolean), `${field}: all 38 districts completed`);
  assert.equal(
    new Set(values.map((value) => value.toLocaleLowerCase("tr-TR"))).size,
    38,
    `${field}: exact repeated district copy`,
  );
}
const shingleDistricts = new Map<string, Set<string>>();
for (const district of nonEsenler) {
  for (const field of completedFields) {
    const words = (district.sections[field] ?? "")
      .toLocaleLowerCase("tr-TR")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim()
      .split(/\s+/);
    const local = new Set<string>();
    for (let i = 0; i <= words.length - 12; i += 1)
      local.add(words.slice(i, i + 12).join(" "));
    for (const shingle of local) {
      const districts = shingleDistricts.get(shingle) ?? new Set<string>();
      districts.add(district.district);
      shingleDistricts.set(shingle, districts);
    }
  }
}
const overusedShingle = [...shingleDistricts].find(
  ([, districts]) => districts.size > 4,
);
assert.equal(
  overusedShingle,
  undefined,
  overusedShingle
    ? `repeated 12-word copy in ${overusedShingle[1].size} districts: ${overusedShingle[0]}`
    : "no overused 12-word copy",
);
const completedCopy = nonEsenler
  .flatMap((district) =>
    completedFields.map((field) => district.sections[field]),
  )
  .join("\n");
assert.ok(
  !/İstanbul['’]un önemli ilçelerinden|yatırımcıların gözdesi|yüksek prim potansiyeli|eşsiz yaşam fırsatı/i.test(
    completedCopy,
  ),
  "generic or promotional copy",
);

assert.equal(historicalPhotos.schemaVersion, 1);
assert.equal(historicalPhotos.districts.length, 39);
assert.deepEqual(
  new Set(historicalPhotos.districts.map((district) => district.district)),
  new Set(editorial.districts.map((district) => district.district)),
);
for (const district of historicalPhotos.districts) {
  assert.ok(district.notes.trim(), `${district.district}: photo research note`);
  assert.match(
    district.notes,
    /İkinci turda.*SALT.*İBB Atatürk Kitaplığı.*Europeana/i,
    `${district.district}: second-round archive classes`,
  );
  for (const candidate of district.candidates) {
    assert.ok(candidate.recordUrl.startsWith("https://"));
    assert.ok(candidate.archive.trim());
    assert.ok(candidate.rightsStatement.trim());
    assert.ok(candidate.license.trim());
    assert.ok(candidate.requiredAttribution.trim());
    assert.ok(candidate.notes.trim());
    if (candidate.currentDistrictMatch === "uncertain")
      assert.equal(candidate.publicationSafe, false);
    if (candidate.publicationSafe) {
      assert.match(
        candidate.license,
        /Public domain|CC0|CC BY(?:-SA)?|No known restrictions/i,
      );
      assert.doesNotMatch(candidate.license, /(?:^|[- ])(?:NC|ND)(?:$|[- ])/i);
    }
  }
}
// Content mutation must lose public approval; neither missing provenance nor a wrong section can pass.
const invalid = structuredClone(editorial);
invalid.districts[0].sources.forEach((s) => {
  s.needsVerification = true;
});
assert.throws(() =>
  attachEditorial(structuredClone(research), invalid, referenceTime),
);
const mismatch = structuredClone(editorial);
mismatch.districts[0].pdfSha256 = "0".repeat(64);
assert.throws(() =>
  attachEditorial(structuredClone(research), mismatch, referenceTime),
);
const invalidPopulation = structuredClone(editorial);
const invalidPopulationFacts = requireDistrictRow(
  invalidPopulation.districts,
  "bahcelievler",
  "editorial",
).facts;
assert.ok(invalidPopulationFacts, "bahcelievler: facts required");
invalidPopulationFacts.population = "539036";
assert.throws(() =>
  attachEditorial(structuredClone(research), invalidPopulation, referenceTime),
);
const invalidPopulationSource = structuredClone(editorial);
const populationSource = requireDistrictRow(
  invalidPopulationSource.districts,
  "bahcelievler",
  "editorial",
).sources.find((source) => source.sections?.includes("facts"));
assert.ok(populationSource, "bahcelievler: facts source required");
populationSource.needsVerification = true;
assert.throws(() =>
  attachEditorial(
    structuredClone(research),
    invalidPopulationSource,
    referenceTime,
  ),
);
const invalidAdoption = structuredClone(editorial);
const adoption = requireDistrictRow(
  invalidAdoption.districts,
  "esenler",
  "editorial",
).adoption;
assert.ok(adoption, "esenler: adoption required");
adoption.contentFingerprint = "0".repeat(64);
assert.throws(() =>
  attachEditorial(structuredClone(research), invalidAdoption, referenceTime),
);
assertBatch1PopulationImportPlan({ ...batch1PopulationPlan });
const populationPlanActions = [
  "update",
  "skip",
  "create",
  "conflict",
] as const satisfies ReadonlyArray<keyof typeof batch1PopulationPlan>;
assert.deepEqual(
  [...populationPlanActions].sort(),
  Object.keys(batch1PopulationPlan).sort(),
);
for (const action of populationPlanActions) {
  assert.throws(() =>
    assertBatch1PopulationImportPlan({
      ...batch1PopulationPlan,
      [action]: batch1PopulationPlan[action] + 1,
    }),
  );
}
const result = {
  checkedAt: new Date().toISOString(),
  referenceTime: new Date(referenceTime).toISOString(),
  result: "39/39 PASS",
  scope:
    "Kaynak incelemesine bağlı sınırlı yayın içeriği; tüm PDF iddialarının veya bütün bölümlerin doğrulandığı anlamına gelmez.",
  rows,
};
if (options.report)
  writeFileSync(options.report, JSON.stringify(result, null, 2) + "\n");
console.log(
  result.result,
  "— reviewed editorial sections + 39 official neighborhood lists; unverified fields withheld",
);
