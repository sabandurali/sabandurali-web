import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { attachEditorial, type EditorialBundle } from "./editorial";
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
  for (const field of [
    "facts",
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
    verified: ["summary", "history", "geography", "neighborhoods"],
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
const result = {
  checkedAt: new Date().toISOString(),
  result: "39/39 PASS",
  scope:
    "Kaynak incelemesine bağlı sınırlı yayın içeriği; tüm PDF iddialarının veya bütün bölümlerin doğrulandığı anlamına gelmez.",
  rows,
};
writeFileSync(
  "reports/istanbul-39/content-acceptance.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(
  result.result,
  "— core editorial + 39 official neighborhood lists; unverified fields withheld",
);
