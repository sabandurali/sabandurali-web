import { getText, isRecord } from "@/content/guards";
import {
  districtSectionOptions,
  isDistrictSourceType,
  sectionIsPublic,
  sourceSupportsSection,
  type DistrictSection,
  type DistrictSource,
} from "./district-content-policy";

export type DistrictGuide = {
  summary: string | null;
  history: string | null;
  geography: string | null;
  life: string | null;
  transportation: string | null;
  placesGuide: string | null;
  distinctiveFeatures: string | null;
  researchTopics: string | null;
  facts: {
    population?: string | null;
    populationYear?: number | null;
    areaKm2?: number | null;
    neighborhoodCount?: number | null;
    neighboringDistricts?: string | null;
    locationSummary?: string | null;
  } | null;
  neighborhoods: Array<{
    id?: string | null;
    name: string;
    featured?: boolean | null;
    description?: string | null;
  }>;
  housingTexture: string | null;
  regionalAssessment: string | null;
  marketData: {
    salePricePerM2?: number | null;
    averageRent?: number | null;
    dataDate?: string | null;
    source?: string | null;
    sourceUrl?: string | null;
    checkedAt?: string | null;
    description?: string | null;
    /** Always false when public; kept so the projection is idempotent. */
    needsVerification?: boolean | null;
  } | null;
  planningDevelopments: Array<{
    id?: string | null;
    title: string;
    summary?: string | null;
    neighborhood?: string | null;
    date?: string | null;
    status?: string | null;
    officialSource?: string | null;
    checkedAt?: string | null;
    needsVerification?: boolean | null;
  }>;
  sources: DistrictSource[];
  /**
   * When the guide went live. A scheduled guide is saved before that day,
   * so its `updatedAt` predates the day the page first shows it.
   */
  publishedAt: string | null;
  updatedAt: string | null;
};

/*
 * Allowlist copies. Every public object is built key by key, so a field that
 * is added to the collection later (an internal note, a verification
 * comment) never reaches the public page, REST API or page props unless it
 * is added here on purpose. Only keys present in the input are copied, so
 * the projection of an already projected guide is unchanged.
 */
/** The value when it is a string or null; undefined means "do not copy". */
function stringField(value: unknown): string | null | undefined {
  return typeof value === "string" || value === null ? value : undefined;
}

function numberField(value: unknown): number | null | undefined {
  return (typeof value === "number" && Number.isFinite(value)) || value === null
    ? value
    : undefined;
}

function booleanField(value: unknown): boolean | null | undefined {
  return typeof value === "boolean" || value === null ? value : undefined;
}

/** Copies only defined values, so absent keys stay absent. */
function definedEntries<T extends object>(value: T): Partial<T> {
  const result: Partial<T> = {};

  for (const key of Object.keys(value) as Array<keyof T>) {
    if (value[key] !== undefined) result[key] = value[key];
  }

  return result;
}

type DistrictFacts = NonNullable<DistrictGuide["facts"]>;
type DistrictMarketData = NonNullable<DistrictGuide["marketData"]>;

function copyFacts(value: Record<string, unknown>): DistrictFacts {
  return definedEntries<DistrictFacts>({
    population: stringField(value.population),
    populationYear: numberField(value.populationYear),
    areaKm2: numberField(value.areaKm2),
    neighborhoodCount: numberField(value.neighborhoodCount),
    neighboringDistricts: stringField(value.neighboringDistricts),
    locationSummary: stringField(value.locationSummary),
  });
}

function copyMarketData(value: Record<string, unknown>): DistrictMarketData {
  return definedEntries<DistrictMarketData>({
    salePricePerM2: numberField(value.salePricePerM2),
    averageRent: numberField(value.averageRent),
    dataDate: stringField(value.dataDate),
    source: stringField(value.source),
    sourceUrl: stringField(value.sourceUrl),
    checkedAt: stringField(value.checkedAt),
    description: stringField(value.description),
    needsVerification: booleanField(value.needsVerification),
  });
}

const sectionValues: ReadonlyArray<string> = districtSectionOptions.map(
  ({ value }) => value,
);

function isDistrictSection(value: unknown): value is DistrictSection {
  return typeof value === "string" && sectionValues.includes(value);
}

/** A source reduced to the fields of DistrictSource with checked types. */
function sanitizeSource(value: Record<string, unknown>): DistrictSource {
  const optional = definedEntries({
    primary: booleanField(value.primary),
    dataDate: stringField(value.dataDate),
    checkedAt: stringField(value.checkedAt),
    needsVerification: booleanField(value.needsVerification),
  });

  return {
    title: typeof value.title === "string" ? value.title : "",
    publisher: typeof value.publisher === "string" ? value.publisher : "",
    url: typeof value.url === "string" ? value.url : "",
    sourceType: isDistrictSourceType(value.sourceType)
      ? value.sourceType
      : "unclassified",
    ...optional,
    ...(Array.isArray(value.sections)
      ? { sections: value.sections.filter(isDistrictSection) }
      : value.sections === null
        ? { sections: null }
        : {}),
  };
}

/**
 * Raw CMS `sources` normalized for the content policy: non-objects are
 * dropped and every field is type-checked. CMS validation and the public
 * projection read sources the same way.
 */
export function sanitizeDistrictSources(value: unknown): DistrictSource[] {
  return Array.isArray(value) ? value.filter(isRecord).map(sanitizeSource) : [];
}

export function mapDistrictGuide(
  value: unknown,
  now = Date.now(),
): DistrictGuide | null {
  if (!isRecord(value)) return null;
  const item = value;
  const reviewed = Array.isArray(item.reviewedSections)
    ? item.reviewedSections.filter((x): x is string => typeof x === "string")
    : [];
  const sources = sanitizeDistrictSources(item.sources);
  const can = (section: DistrictSection) =>
    sectionIsPublic(section, reviewed, sources, now);
  const field = (section: DistrictSection) =>
    can(section) ? getText(item[section]) : null;
  const rows = <T>(
    raw: unknown,
    map: (row: Record<string, unknown>) => T | null,
  ): T[] =>
    Array.isArray(raw)
      ? raw.filter(isRecord).flatMap((row) => map(row) ?? [])
      : [];
  const market = isRecord(item.marketData) ? item.marketData : null;
  const marketSource =
    market &&
    sources.find(
      (source) =>
        source.url === market.sourceUrl &&
        sourceSupportsSection(source, "marketData", now),
    );
  const freshRow = (
    row: Record<string, unknown>,
    section: "marketData" | "planningDevelopments",
    url: unknown,
  ) =>
    row.needsVerification === false &&
    sources.some(
      (source) =>
        source.url === url &&
        sourceSupportsSection(
          {
            ...source,
            dataDate: getText(row.dataDate ?? row.date),
            checkedAt: getText(row.checkedAt),
          },
          section,
          now,
        ),
    );
  /*
   * "Current" in §H applies to plans that can still change. A completed
   * project is a dated historical fact: it stays public with its dated,
   * verified official source and is exempt from the 90-day window below.
   */
  const completedPlanningRow = (row: Record<string, unknown>) =>
    getText(row.status) === "tamamlandi";
  const currentPlanningRow = (row: Record<string, unknown>) => {
    const threshold = now - 90 * 24 * 60 * 60 * 1000;
    const checkedAt = Date.parse(getText(row.checkedAt) ?? "");
    const date = Date.parse(getText(row.date) ?? "");
    return checkedAt >= threshold && date >= threshold;
  };
  const marketData: DistrictMarketData | null =
    can("marketData") &&
    market &&
    marketSource &&
    freshRow(market, "marketData", market.sourceUrl)
      ? copyMarketData(market)
      : null;
  const planningDevelopments: DistrictGuide["planningDevelopments"] = can(
    "planningDevelopments",
  )
    ? rows(item.planningDevelopments, (row) => {
        const title = getText(row.title);
        return title &&
          (completedPlanningRow(row) ||
            (currentPlanningRow(row) &&
              freshRow(row, "planningDevelopments", row.officialSource))) &&
          row.needsVerification === false &&
          sources.some(
            (source) =>
              source.url === row.officialSource &&
              sourceSupportsSection(
                {
                  ...source,
                  dataDate: getText(row.date),
                  checkedAt: getText(row.checkedAt),
                },
                "planningDevelopments",
                now,
              ),
          )
          ? {
              title,
              id: getText(row.id),
              summary: getText(row.summary),
              neighborhood: getText(row.neighborhood),
              date: getText(row.date),
              status: getText(row.status),
              officialSource: getText(row.officialSource),
              checkedAt: getText(row.checkedAt),
              needsVerification: false,
            }
          : null;
      })
    : [];
  /*
   * A source lists a row-backed section only when a row it backs is
   * actually published: a rejected market or planning row must not leave a
   * public source that claims to support it.
   */
  const backsPublishedRows = (
    source: DistrictSource,
    section: DistrictSection,
  ) => {
    if (section === "marketData")
      return marketData !== null && marketData.sourceUrl === source.url;
    if (section === "planningDevelopments")
      return planningDevelopments.some(
        (row) => row.officialSource === source.url,
      );
    return true;
  };
  return {
    summary: field("summary"),
    history: field("history"),
    geography: field("geography"),
    life: field("life"),
    transportation: field("transportation"),
    placesGuide: field("placesGuide"),
    distinctiveFeatures: field("distinctiveFeatures"),
    researchTopics: field("researchTopics"),
    facts: can("facts") && isRecord(item.facts) ? copyFacts(item.facts) : null,
    neighborhoods: can("neighborhoods")
      ? rows(item.neighborhoods, (row) => {
          const name = getText(row.name);
          return name
            ? {
                name,
                id: getText(row.id),
                featured: row.featured === true,
                description: getText(row.description),
              }
            : null;
        })
      : [],
    housingTexture: field("housingTexture"),
    regionalAssessment: field("regionalAssessment"),
    marketData,
    planningDevelopments,
    sources: sources.flatMap((source) => {
      const sections = districtSectionOptions
        .map(({ value }) => value)
        .filter(
          (section) =>
            reviewed.includes(section) &&
            sourceSupportsSection(source, section, now) &&
            backsPublishedRows(source, section),
        );
      return sections.length > 0 ? [{ ...source, sections }] : [];
    }),
    publishedAt: getText(item.publishedAt),
    updatedAt: getText(item.updatedAt),
  };
}

/** Defense in depth for page rendering in addition to Payload access/query rules. */
export function projectPublishedDistrictGuide(
  value: unknown,
  now = Date.now(),
): DistrictGuide | null {
  const item = isRecord(value) ? value : null;
  const publishedAt = item ? getText(item.publishedAt) : null;
  if (
    !item ||
    item._status !== "published" ||
    !publishedAt ||
    !Number.isFinite(Date.parse(publishedAt)) ||
    Date.parse(publishedAt) > now
  ) {
    return null;
  }
  return mapDistrictGuide(item, now);
}

/** Top-level keys of a district guide document that anonymous readers get. */
export const PUBLIC_DISTRICT_GUIDE_DOCUMENT_KEYS = [
  "id",
  "district",
  "_status",
  "publishedAt",
  "createdAt",
  "reviewedSections",
  "summary",
  "history",
  "geography",
  "life",
  "transportation",
  "placesGuide",
  "distinctiveFeatures",
  "researchTopics",
  "facts",
  "neighborhoods",
  "housingTexture",
  "regionalAssessment",
  "marketData",
  "planningDevelopments",
  "sources",
  "updatedAt",
] as const;

/**
 * The anonymous (REST and Local API) view of a district guide document: an
 * explicit allowlist of identity fields plus the public projection, instead
 * of the stored document with a few fields blanked out. `reviewedSections`
 * is reduced to the sections that are actually public, which keeps the
 * projection idempotent when the page projects the document again.
 */
export function projectPublicDistrictGuideDocument(
  value: unknown,
  now = Date.now(),
): Record<string, unknown> {
  if (!isRecord(value)) return {};

  const guide = mapDistrictGuide(value, now);
  if (guide === null) return {};

  const publicSections = new Set(
    guide.sources.flatMap((source) => source.sections ?? []),
  );

  return {
    id: value.id,
    district: value.district,
    _status: value._status,
    createdAt: value.createdAt,
    reviewedSections: districtSectionOptions
      .map(({ value: section }) => section)
      .filter((section) => publicSections.has(section)),
    ...guide,
  };
}
