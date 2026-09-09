import { createHash } from "node:crypto";
import type { DistrictGuide } from "../../src/payload-types";
import { districts } from "../../src/content/districts/district-registry";
import {
  isPublicSourceUrl,
  type DistrictSource,
} from "../../src/content/districts/district-content-policy";
import { editorialFields, type EditorialRecord } from "./editorial";
export type ResearchRecord = {
  editorial?: EditorialRecord;
  district: string;
  name: string;
  document: { file: string; sha256: string; pages: number };
  sections: Record<string, string>;
  sources: DistrictSource[];
  sourceAppendix: string;
  reviewedSections: string[];
  needsVerification: boolean;
};
export type ResearchBundle = {
  schemaVersion: number;
  publicationStatus: string;
  districts: ResearchRecord[];
};
export const importVersion = 3;
export function researchFingerprint(row: ResearchRecord): string {
  return createHash("sha256")
    .update(JSON.stringify(canonical(row)))
    .digest("hex");
}
export const ownedFields = [
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
  "researchNotes",
  "sources",
  "reviewedSections",
  "facts",
  "neighborhoods",
  "marketData",
  "planningDevelopments",
] as const;
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([k, v]) => k !== "id" && v !== undefined && v !== null)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, canonical(v)]),
    );
  return value;
}
export function fingerprint(doc: Record<string, unknown>): string {
  return createHash("sha256")
    .update(
      JSON.stringify(
        canonical(
          Object.fromEntries(ownedFields.map((field) => [field, doc[field]])),
        ),
      ),
    )
    .digest("hex");
}
export function validateBundle(bundle: ResearchBundle) {
  if (
    bundle.schemaVersion !== 1 ||
    bundle.publicationStatus !== "draft-only-unverified-research" ||
    bundle.districts?.length !== districts.length
  )
    throw new Error("Exactly 39 draft research records required.");
  const seen = new Set<string>();
  for (const row of bundle.districts) {
    const district = districts.find((item) => item.slug === row.district);
    if (!district || district.name !== row.name || seen.has(row.district))
      throw new Error(`Unknown/duplicate district: ${row.district}`);
    seen.add(row.district);
    if (
      !/^[a-f0-9]{64}$/.test(row.document.sha256) ||
      !row.document.pages ||
      row.needsVerification !== true ||
      row.reviewedSections.length
    )
      throw new Error(`Invalid draft provenance: ${row.district}`);
    for (const field of [
      "history",
      "geography",
      "life",
      "neighborhoods",
      "housingTexture",
      "planningDevelopments",
      "placesGuide",
      "distinctiveFeatures",
      "researchTopics",
    ])
      if (!row.sections[field]?.trim())
        throw new Error(`Missing section: ${row.district}/${field}`);
    if (
      !row.sources.length ||
      row.sources.some(
        (s) =>
          !isPublicSourceUrl(s.url) ||
          s.needsVerification !== true ||
          !s.title ||
          !s.publisher,
      )
    )
      throw new Error(`Invalid sources: ${row.district}`);
  }
}
export function makeDraft(
  row: ResearchRecord,
): Partial<DistrictGuide> & Pick<DistrictGuide, "district"> {
  return {
    district: row.district as DistrictGuide["district"],
    _status: "draft",
    summary: "",
    history: row.editorial ? "" : row.sections.history,
    geography: row.editorial ? "" : row.sections.geography,
    life: row.editorial ? "" : row.sections.life,
    transportation: "",
    housingTexture: row.editorial ? "" : row.sections.housingTexture,
    regionalAssessment: "",
    placesGuide: row.editorial ? "" : row.sections.placesGuide,
    distinctiveFeatures: row.editorial ? "" : row.sections.distinctiveFeatures,
    researchTopics: row.editorial ? "" : row.sections.researchTopics,
    researchNotes: [
      "HAM ARAŞTIRMA — PUBLIC DIŞI. Sayısal veriler, mahalleler ve proje durumları kaynak üzerinden doğrulanmalıdır.",
      "MAHALLELER",
      row.sections.neighborhoods,
      "İMAR / DÖNÜŞÜM",
      row.sections.planningDevelopments,
      "KAYNAKLAR VE SAHA EKİ",
      row.sourceAppendix,
    ].join("\n\n"),
    reviewedSections: [],
    sources: row.sources,
    neighborhoods: [],
    planningDevelopments: [],
    facts: {
      population: null,
      populationYear: null,
      areaKm2: null,
      neighborhoodCount: null,
      neighboringDistricts: null,
      locationSummary: null,
    },
    marketData: {
      needsVerification: true,
      salePricePerM2: null,
      averageRent: null,
      dataDate: null,
      source: null,
      sourceUrl: null,
      checkedAt: null,
      description: null,
    },
    ...(row.editorial ? editorialFields(row.editorial) : {}),
    importProvenance: {
      version: importVersion,
      sourceFingerprint: researchFingerprint(row),
      ...row.document,
    },
  };
}
export function decideImport(
  existing: Record<string, unknown> | undefined,
  row: ResearchRecord,
): { action: "create" | "update" | "skip"; reason: string } {
  if (!existing) return { action: "create", reason: "new district draft" };
  const provenance = existing.importProvenance as Record<
    string,
    unknown
  > | null;
  if (
    !provenance?.fingerprint ||
    provenance.fingerprint !== fingerprint(existing)
  )
    return { action: "skip", reason: "manual/unmanaged content protected" };
  if (existing._status === "published")
    return { action: "skip", reason: "published content protected" };
  if (
    provenance.sha256 === row.document.sha256 &&
    provenance.version === importVersion &&
    provenance.sourceFingerprint === researchFingerprint(row)
  )
    return { action: "skip", reason: "unchanged source" };
  return {
    action: "update",
    reason: "unchanged imported draft; source changed",
  };
}
