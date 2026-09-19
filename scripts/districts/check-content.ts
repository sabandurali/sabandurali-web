import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import {
  assertBatch1PopulationImportPlan,
  attachEditorial,
  batch1PopulationFacts,
  batch1PopulationPlan,
  type EditorialBundle,
} from "./editorial";
import { makeDraft, validateBundle, type ResearchBundle } from "./import-core";
import { mapDistrictGuide } from "../../src/content/districts/district-guide-projection";

const research = JSON.parse(
  readFileSync("data/districts/research.json", "utf8"),
) as ResearchBundle;
const editorial = JSON.parse(
  readFileSync("data/districts/editorial.json", "utf8"),
) as EditorialBundle;
const evidence = JSON.parse(
  readFileSync("reports/istanbul-39/editorial-review.json", "utf8"),
) as Array<{
  district: string;
  officialNames: string[];
  neighborhoodStatus: string;
}>;
const expectedCounts = [
  38, 10, 22, 11, 15, 10, 11, 23, 10, 45, 24, 39, 19, 43, 29, 57, 16, 11, 19,
  21, 38, 35, 15, 25, 13, 5, 17, 45, 21, 21, 20, 18, 36, 19, 15, 62, 17, 35, 33,
];
validateBundle(research);
attachEditorial(research, editorial);
const rows = research.districts.map((r, i) => {
  const review = r.editorial!;
  const draft = makeDraft(r);
  const projected = mapDistrictGuide(draft)!;
  const proof = evidence.find((e) => e.district === r.district)!;
  assert.equal(proof.neighborhoodStatus, "verified-current-directory");
  assert.deepEqual(
    projected.neighborhoods.map((n) => n.name),
    proof.officialNames,
  );
  assert.equal(projected.neighborhoods.length, expectedCounts[i], r.district);
  for (const section of ["summary", "history", "geography"] as const) {
    assert.ok(
      projected[section] && projected[section] === review.sections[section],
    );
    assert.notEqual(projected[section], r.sections[section]);
    assert.ok(
      !/\b(?:TL|ADNKS)\b|%\s*\d|\d[.,]\d+\s*(?:m²|yıl|milyon)/.test(
        projected[section]!,
      ),
      `${r.district}: volatile claim`,
    );
  }
  const expectedFacts =
    batch1PopulationFacts[
      r.district as keyof typeof batch1PopulationFacts
    ];
  if (expectedFacts) {
    assert.deepEqual(projected.facts, expectedFacts, `${r.district}/facts`);
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
    assert.ok(!/Nüfus|nüfus yılı/.test(review.excluded.facts));
  } else {
    assert.equal(projected.facts, null, `${r.district}/facts must be withheld`);
  }
  for (const field of [
    "marketData",
    "transportation",
    "life",
    "housingTexture",
    "regionalAssessment",
    "placesGuide",
    "distinctiveFeatures",
    "researchTopics",
  ] as const) {
    assert.equal(
      projected[field],
      null,
      `${r.district}/${field} must be withheld`,
    );
    assert.ok(review.excluded[field]);
  }
  assert.deepEqual(projected.planningDevelopments, []);
  const publicJSON = JSON.stringify(projected);
  assert.ok(!publicJSON.includes(r.sourceAppendix));
  assert.ok(
    !publicJSON.includes("importProvenance") &&
      !publicJSON.includes("researchNotes"),
  );
  assert.ok(projected.sources.every((s) => s.needsVerification === false));
  assert.ok(review.methodology && Date.parse(review.checkedAt) <= Date.now());
  return {
    district: r.district,
    result: "PASS",
    verified: [
      "summary",
      "history",
      "geography",
      "neighborhoods",
      ...(expectedFacts ? ["facts"] : []),
    ],
    neighborhoods: projected.neighborhoods.length,
    sourceCount: projected.sources.length,
    excluded: review.excluded,
  };
});
// Content mutation must lose public approval; neither missing provenance nor a wrong section can pass.
const invalid = structuredClone(editorial);
invalid.districts[0].sources.forEach((s) => {
  s.needsVerification = true;
});
assert.throws(() => attachEditorial(structuredClone(research), invalid));
const mismatch = structuredClone(editorial);
mismatch.districts[0].pdfSha256 = "0".repeat(64);
assert.throws(() => attachEditorial(structuredClone(research), mismatch));
const invalidPopulation = structuredClone(editorial);
invalidPopulation.districts.find(
  (row) => row.district === "bahcelievler",
)!.facts!.population = "539036";
assert.throws(() =>
  attachEditorial(structuredClone(research), invalidPopulation),
);
const invalidPopulationSource = structuredClone(editorial);
invalidPopulationSource.districts
  .find((row) => row.district === "bahcelievler")!
  .sources.find((source) => source.sections?.includes("facts"))!.needsVerification =
  true;
assert.throws(() =>
  attachEditorial(structuredClone(research), invalidPopulationSource),
);
assertBatch1PopulationImportPlan({ ...batch1PopulationPlan });
for (const action of Object.keys(batch1PopulationPlan) as Array<
  keyof typeof batch1PopulationPlan
>) {
  assert.throws(() =>
    assertBatch1PopulationImportPlan({
      ...batch1PopulationPlan,
      [action]: batch1PopulationPlan[action] + 1,
    }),
  );
}
const result = {
  checkedAt: new Date().toISOString(),
  result: "39/39 PASS",
  scope:
    "Kaynak incelemesine bağlı sınırlı yayın içeriği; tüm PDF iddialarının veya bütün bölümlerin doğrulandığı anlamına gelmez.",
  rows,
};
if (process.env.DISTRICT_CONTENT_WRITE_REPORT !== "0")
  writeFileSync(
    "reports/istanbul-39/content-acceptance.json",
    JSON.stringify(result, null, 2) + "\n",
  );
console.log(
  result.result,
  "— core editorial + 39 official neighborhood lists; Batch 1 facts verified, other unverified fields withheld",
);
