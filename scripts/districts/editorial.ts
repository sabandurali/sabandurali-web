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
  areaKm2?: number | null;
  neighborhoodCount?: number | null;
  neighboringDistricts?: string | null;
  locationSummary?: string | null;
};
type EditorialMarketData = NonNullable<DistrictGuide["marketData"]>;
type EditorialAdoption = {
  currentFingerprint: string;
  contentFingerprint: string;
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
  marketData?: EditorialMarketData;
  neighborhoods: string[];
  sources: DistrictSource[];
  reviewedSections?: DistrictSection[];
  adoption?: EditorialAdoption;
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
export const editorialContentFields = [
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
  "sources",
  "reviewedSections",
  "facts",
  "marketData",
] as const;

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key, child]) =>
          key !== "id" && child !== undefined && child !== null
        )
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonical(child)]),
    );
  return value;
}

export function editorialContentFingerprint(
  document: Record<string, unknown>,
): string {
  return createHash("sha256")
    .update(
      JSON.stringify(
        canonical(
          Object.fromEntries(
            editorialContentFields.map((field) => [field, document[field]]),
          ),
        ),
      ),
    )
    .digest("hex");
}
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
  for (const row of research.districts) {
    const review = editorial.districts.find((r) => r.district === row.district);
    if (!review || review.pdfSha256 !== row.document.sha256)
      throw new Error(`Editorial/PDF mismatch: ${row.district}`);
    const derivedReviewed = Object.keys(review.sections) as DistrictSection[];
    if (review.neighborhoods.length) derivedReviewed.push("neighborhoods");
    if (review.facts) derivedReviewed.push("facts");
    const reviewed = review.reviewedSections ?? derivedReviewed;
    if (new Set(reviewed).size !== reviewed.length)
      throw new Error(`Duplicate reviewed section: ${row.district}`);
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
    }
    if (review.facts && !reviewed.includes("facts"))
      throw new Error(`Facts must be reviewed: ${row.district}`);
    for (const section of Object.keys(review.sections) as DistrictSection[])
      if (!reviewed.includes(section))
        throw new Error(`Editorial section must be reviewed: ${row.district}/${section}`);
    if (review.neighborhoods.length && !reviewed.includes("neighborhoods"))
      throw new Error(`Neighborhoods must be reviewed: ${row.district}`);
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
    if (review.adoption) {
      if (
        !/^[a-f0-9]{64}$/.test(review.adoption.currentFingerprint) ||
        !/^[a-f0-9]{64}$/.test(review.adoption.contentFingerprint) ||
        review.adoption.contentFingerprint !==
          editorialContentFingerprint(
            editorialFields(review) as Record<string, unknown>,
          )
      )
        throw new Error(`Invalid editorial adoption: ${row.district}`);
    }
    row.editorial = review;
  }
  return research;
}
export function editorialFields(
  review: EditorialRecord,
): Partial<DistrictGuide> {
  const derivedSections = Object.keys(review.sections) as DistrictSection[];
  if (review.neighborhoods.length) derivedSections.push("neighborhoods");
  if (review.facts) derivedSections.push("facts");
  return {
    ...review.sections,
    ...(review.facts ? { facts: { ...review.facts } } : {}),
    ...(review.marketData ? { marketData: { ...review.marketData } } : {}),
    neighborhoods: review.neighborhoods.map((name) => ({
      name,
      featured: false,
    })),
    sources: review.sources,
    reviewedSections: review.reviewedSections ?? derivedSections,
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
