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
const historicalPhotos = JSON.parse(
  readFileSync("data/districts/historical-photo-candidates.json", "utf8"),
) as {
  schemaVersion: number;
  districts: Array<{
    district: string;
    candidates: Array<{
      archive: string;
      recordUrl: string;
      rightsStatement: string;
      publicationSafe: boolean;
      license: string;
      requiredAttribution: string;
      currentDistrictMatch: "verified" | "probable" | "uncertain";
      notes: string;
    }>;
    notes: string;
  }>;
};
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
    assert.ok(!/Nüfus|nüfus yılı/.test(review.excluded.facts));
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
    const editorialValue = review.sections[field];
    if (editorialValue) {
      assert.equal(projected[field], editorialValue, `${r.district}/${field}`);
    } else {
      assert.equal(
        projected[field],
        null,
        `${r.district}/${field} must be withheld`,
      );
      assert.ok(review.excluded[field]);
    }
  }
  assert.equal(projected.marketData, null, `${r.district}/marketData withheld`);
  assert.ok(review.excluded.marketData);
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
    verified: draft.reviewedSections,
    neighborhoods: projected.neighborhoods.length,
    sourceCount: projected.sources.length,
    excluded: review.excluded,
  };
});

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
    Number.isFinite(facts.areaKm2) && facts.areaKm2! > 0,
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
  const topics = district.sections.researchTopics!
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
      district.sections.researchTopics!,
    ),
    `${district.district}/researchTopics: research artifact`,
  );
}
for (const field of completedFields) {
  const values = nonEsenler.map((district) => district.sections[field]!.trim());
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
    const words = district.sections[field]!
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
  .flatMap((district) => completedFields.map((field) => district.sections[field]))
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
const invalidAdoption = structuredClone(editorial);
invalidAdoption.districts.find(
  (row) => row.district === "esenler",
)!.adoption!.contentFingerprint = "0".repeat(64);
assert.throws(() => attachEditorial(structuredClone(research), invalidAdoption));
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
  "— reviewed editorial sections + 39 official neighborhood lists; unverified fields withheld",
);
