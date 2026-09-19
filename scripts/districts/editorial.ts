import { createHash } from "node:crypto";
import type { DistrictGuide } from "../../src/payload-types";
import {
  sectionIsPublic,
  sourceSupportsSection,
  type DistrictSection,
  type DistrictSource,
} from "../../src/content/districts/district-content-policy";
import type { ResearchBundle } from "./import-core";

type TextSection = Exclude<
  DistrictSection,
  "facts" | "neighborhoods" | "marketData" | "planningDevelopments"
>;
type EditorialFacts = {
  population: string;
  populationYear: number;
};
export const batch1PopulationFacts = {
  bahcelievler: { population: "539035", populationYear: 2025 },
  sisli: { population: "261959", populationYear: 2025 },
  sultanbeyli: { population: "378908", populationYear: 2025 },
  kartal: { population: "475630", populationYear: 2025 },
  sultangazi: { population: "529306", populationYear: 2025 },
  beykoz: { population: "246833", populationYear: 2025 },
  kadikoy: { population: "458573", populationYear: 2025 },
  basaksehir: { population: "536797", populationYear: 2025 },
} as const satisfies Record<string, EditorialFacts>;
export const batch1PopulationPlan = {
  update: 8,
  skip: 31,
  create: 0,
  conflict: 0,
} as const;
export type Batch1PopulationImportPlan = Record<
  keyof typeof batch1PopulationPlan,
  number
>;
export type EditorialRecord = {
  district: string;
  pdfSha256: string;
  checkedAt: string;
  sections: Partial<Record<TextSection, string>>;
  facts?: EditorialFacts;
  neighborhoods: string[];
  sources: DistrictSource[];
  excluded: Record<string, string>;
  methodology: string;
};
export type EditorialBundle = {
  schemaVersion: 1;
  districts: EditorialRecord[];
};
const tuikAdnks2025Title =
  "Adrese Dayalı Nüfus Kayıt Sistemi Sonuçları, 2025";
const tuikAdnks2025DataDate = "2025-12-31T00:00:00.000Z";
const tuikAdnks2025Url =
  "https://data.tuik.gov.tr/Bulten/Index?p=Adrese-Dayali-Nufus-Kayit-Sistemi-Sonuclari-2025-53899";
export function assertBatch1PopulationImportPlan(
  plan: Batch1PopulationImportPlan,
) {
  const mismatch = Object.entries(batch1PopulationPlan).find(
    ([action, expected]) => plan[action as keyof typeof plan] !== expected,
  );
  if (mismatch) {
    throw new Error(
      `Batch 1 population import blocked before write: expected 8 update / 31 skip / 0 create / 0 conflict; received ${plan.update} update / ${plan.skip} skip / ${plan.create} create / ${plan.conflict} conflict.`,
    );
  }
}
export function attachEditorial(
  research: ResearchBundle,
  editorial: EditorialBundle,
) {
  if (
    editorial.schemaVersion !== 1 ||
    editorial.districts.length !== 39 ||
    new Set(editorial.districts.map((r) => r.district)).size !== 39
  )
    throw new Error("Exactly 39 unique editorial reviews required.");
  const populationDistricts = editorial.districts
    .filter((review) => review.facts !== undefined)
    .map((review) => review.district)
    .sort();
  const expectedPopulationDistricts = Object.keys(batch1PopulationFacts).sort();
  if (
    JSON.stringify(populationDistricts) !==
    JSON.stringify(expectedPopulationDistricts)
  )
    throw new Error("Exactly the eight Batch 1 population facts are required.");
  for (const row of research.districts) {
    const review = editorial.districts.find((r) => r.district === row.district);
    if (!review || review.pdfSha256 !== row.document.sha256)
      throw new Error(`Editorial/PDF mismatch: ${row.district}`);
    const reviewed = Object.keys(review.sections) as DistrictSection[];
    if (review.neighborhoods.length) reviewed.push("neighborhoods");
    const expectedFacts =
      batch1PopulationFacts[
        row.district as keyof typeof batch1PopulationFacts
      ];
    if (expectedFacts) {
      if (
        review.facts?.population !== expectedFacts.population ||
        review.facts.populationYear !== expectedFacts.populationYear
      )
        throw new Error(`Invalid Batch 1 population facts: ${row.district}`);
      if (
        !review.sources.some(
          (source) =>
            source.title === tuikAdnks2025Title &&
            source.url === tuikAdnks2025Url &&
            source.publisher === "Türkiye İstatistik Kurumu" &&
            source.dataDate === tuikAdnks2025DataDate &&
            source.checkedAt === review.checkedAt &&
            sourceSupportsSection(source, "facts"),
        )
      )
        throw new Error(`Invalid TÜİK population source: ${row.district}`);
      reviewed.push("facts");
    }
    for (const section of ["summary", "history", "geography"] as const)
      if (!review.sections[section]?.trim())
        throw new Error(`Missing core editorial: ${row.district}/${section}`);
    for (const section of reviewed)
      if (!sectionIsPublic(section, reviewed, review.sources))
        throw new Error(`Unsupported editorial: ${row.district}/${section}`);
    if (
      !review.methodology ||
      !Object.keys(review.excluded).length ||
      new Set(review.neighborhoods).size !== review.neighborhoods.length
    )
      throw new Error(`Incomplete editorial review: ${row.district}`);
    row.editorial = review;
  }
  return research;
}
export function editorialFields(
  review: EditorialRecord,
): Partial<DistrictGuide> {
  const sections = Object.keys(review.sections) as DistrictSection[];
  if (review.neighborhoods.length) sections.push("neighborhoods");
  if (review.facts) sections.push("facts");
  return {
    ...review.sections,
    ...(review.facts ? { facts: { ...review.facts } } : {}),
    neighborhoods: review.neighborhoods.map((name) => ({
      name,
      featured: false,
    })),
    sources: review.sources,
    reviewedSections: sections,
    researchNotes: JSON.stringify(
      {
        methodology: review.methodology,
        checkedAt: review.checkedAt,
        excluded: review.excluded,
        reviewSha256: createHash("sha256")
          .update(JSON.stringify(review))
          .digest("hex"),
        rawResearch:
          "data/districts/research.json; public dışı araştırma havuzu",
      },
      null,
      2,
    ),
  };
}
