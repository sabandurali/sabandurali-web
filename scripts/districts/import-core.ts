import { createHash } from "node:crypto";
import type { DistrictGuide } from "../../src/payload-types";
import { districts } from "../../src/content/districts/district-registry";
import {
  isPublicSourceUrl,
  districtSectionOptions,
  type DistrictSection,
  type DistrictSource,
} from "../../src/content/districts/district-content-policy";
import {
  editorialContentFingerprint,
  editorialFields,
  type EditorialRecord,
} from "./editorial";
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
type GuideDistrict = DistrictGuide["district"];

function isGuideDistrict(value: string): value is GuideDistrict {
  return districts.some((district) => district.slug === value);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * A typed Payload document (or draft) as a plain record of its fields, for
 * the fingerprint and decision helpers. Spreading copies the fields without
 * a cast, so a renamed field still fails the typecheck where it is written.
 */
export function toFieldRecord(doc: object): Record<string, unknown> {
  const fields: Record<string, unknown> = { ...doc };
  return fields;
}

export function makeDraft(
  row: ResearchRecord,
): Partial<DistrictGuide> & Pick<DistrictGuide, "district"> {
  if (!isGuideDistrict(row.district)) {
    throw new Error(`Unknown district: ${row.district}`);
  }
  return {
    district: row.district,
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
  const provenance = isRecord(existing.importProvenance)
    ? existing.importProvenance
    : null;
  if (
    !provenance?.fingerprint ||
    provenance.fingerprint !== fingerprint(existing)
  ) {
    const adoption = row.editorial?.adoption;
    if (
      provenance?.fingerprint &&
      adoption?.currentFingerprint === fingerprint(existing) &&
      adoption.contentFingerprint === editorialContentFingerprint(existing) &&
      adoption.contentFingerprint ===
        editorialContentFingerprint(toFieldRecord(makeDraft(row)))
    )
      return { action: "skip", reason: "unchanged source" };
    return { action: "skip", reason: "manual/unmanaged content protected" };
  }
  if (
    provenance.sha256 === row.document.sha256 &&
    provenance.version === importVersion &&
    provenance.sourceFingerprint === researchFingerprint(row)
  )
    return { action: "skip", reason: "unchanged source" };
  if (existing._status === "published")
    return { action: "skip", reason: "published content protected" };
  return {
    action: "update",
    reason: "unchanged imported draft; source changed",
  };
}

// ---------------------------------------------------------------------------
// Parsing the research JSON: `unknown` in, a typed bundle or a gate error out

const sectionValues: ReadonlySet<string> = new Set(
  districtSectionOptions.map(({ value }) => value),
);
const sourceTypes: ReadonlySet<string> = new Set([
  "official",
  "academic",
  "secondary",
  "market",
  "unclassified",
]);

function isDistrictSection(value: unknown): value is DistrictSection {
  return typeof value === "string" && sectionValues.has(value);
}

function isSourceType(value: unknown): value is DistrictSource["sourceType"] {
  return typeof value === "string" && sourceTypes.has(value);
}

function invalidResearch(where: string, expected: string): never {
  throw new Error(`Invalid research bundle at ${where}: expected ${expected}.`);
}

function readString(
  record: Record<string, unknown>,
  key: string,
  where: string,
): string {
  const value = record[key];
  return typeof value === "string"
    ? value
    : invalidResearch(`${where}.${key}`, "a string");
}

function readOptional<T>(
  record: Record<string, unknown>,
  key: string,
  where: string,
  guard: (value: unknown) => value is T,
  expected: string,
): T | null | undefined {
  const value = record[key];
  if (value === undefined || value === null) return value;
  return guard(value) ? value : invalidResearch(`${where}.${key}`, expected);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isSectionList(value: unknown): value is DistrictSection[] {
  return Array.isArray(value) && value.every(isDistrictSection);
}

function parseSource(value: unknown, where: string): DistrictSource {
  if (!isRecord(value)) return invalidResearch(where, "a source object");
  const sourceType = value.sourceType;
  if (!isSourceType(sourceType)) {
    return invalidResearch(`${where}.sourceType`, "a known source type");
  }
  const source: DistrictSource = {
    title: readString(value, "title", where),
    publisher: readString(value, "publisher", where),
    url: readString(value, "url", where),
    sourceType,
  };
  const primary = readOptional(value, "primary", where, isBoolean, "a boolean");
  const dataDate = readOptional(value, "dataDate", where, isString, "a string");
  const checkedAt = readOptional(
    value,
    "checkedAt",
    where,
    isString,
    "a string",
  );
  const needsVerification = readOptional(
    value,
    "needsVerification",
    where,
    isBoolean,
    "a boolean",
  );
  const sections = readOptional(
    value,
    "sections",
    where,
    isSectionList,
    "a list of district sections",
  );
  return {
    ...source,
    ...(primary === undefined ? {} : { primary }),
    ...(dataDate === undefined ? {} : { dataDate }),
    ...(checkedAt === undefined ? {} : { checkedAt }),
    ...(needsVerification === undefined ? {} : { needsVerification }),
    ...(sections === undefined ? {} : { sections }),
  };
}

function parseResearchRecord(value: unknown, where: string): ResearchRecord {
  if (!isRecord(value)) return invalidResearch(where, "a district record");
  const document = value.document;
  if (!isRecord(document)) {
    return invalidResearch(`${where}.document`, "a document object");
  }
  const pages = document.pages;
  if (typeof pages !== "number" || !Number.isInteger(pages)) {
    return invalidResearch(`${where}.document.pages`, "an integer");
  }
  const sections = value.sections;
  if (!isRecord(sections)) {
    return invalidResearch(`${where}.sections`, "a sections object");
  }
  const sectionTexts: Record<string, string> = {};
  for (const [key, text] of Object.entries(sections)) {
    sectionTexts[key] =
      typeof text === "string"
        ? text
        : invalidResearch(`${where}.sections.${key}`, "a string");
  }
  const sources = value.sources;
  if (!Array.isArray(sources)) {
    return invalidResearch(`${where}.sources`, "a list");
  }
  const reviewedSections = value.reviewedSections;
  if (!Array.isArray(reviewedSections) || !reviewedSections.every(isString)) {
    return invalidResearch(`${where}.reviewedSections`, "a list of strings");
  }
  const needsVerification = value.needsVerification;
  if (typeof needsVerification !== "boolean") {
    return invalidResearch(`${where}.needsVerification`, "a boolean");
  }

  return {
    district: readString(value, "district", where),
    name: readString(value, "name", where),
    document: {
      file: readString(document, "file", `${where}.document`),
      sha256: readString(document, "sha256", `${where}.document`),
      pages,
    },
    sections: sectionTexts,
    sources: sources.map((source, index) =>
      parseSource(source, `${where}.sources[${index}]`),
    ),
    sourceAppendix: readString(value, "sourceAppendix", where),
    reviewedSections,
    needsVerification,
  };
}

/**
 * Reads `data/districts/research.json` (already `JSON.parse`d) into a typed
 * bundle, then runs the import gates of {@link validateBundle}. A missing or
 * mistyped field stops the import with its path instead of a TypeError
 * further down, and no shape is assumed through a cast.
 */
export function parseResearchBundle(json: unknown): ResearchBundle {
  if (!isRecord(json)) return invalidResearch("$", "an object");
  const schemaVersion = json.schemaVersion;
  if (typeof schemaVersion !== "number") {
    return invalidResearch("$.schemaVersion", "a number");
  }
  const rows = json.districts;
  if (!Array.isArray(rows)) return invalidResearch("$.districts", "a list");

  const bundle: ResearchBundle = {
    schemaVersion,
    publicationStatus: readString(json, "publicationStatus", "$"),
    districts: rows.map((row, index) =>
      parseResearchRecord(row, `$.districts[${index}]`),
    ),
  };
  validateBundle(bundle);
  return bundle;
}
