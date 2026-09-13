import {
  districtSectionOptions,
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
    description?: string | null;
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
  }>;
  sources: DistrictSource[];
  updatedAt: string | null;
};
function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
export function mapDistrictGuide(
  value: unknown,
  now = Date.now(),
): DistrictGuide | null {
  const item = record(value);
  if (!item) return null;
  const reviewed = Array.isArray(item.reviewedSections)
    ? item.reviewedSections.filter((x): x is string => typeof x === "string")
    : [];
  const sources = Array.isArray(item.sources)
    ? (item.sources.filter((x) => record(x)) as DistrictSource[])
    : [];
  const can = (section: DistrictSection) =>
    sectionIsPublic(section, reviewed, sources, now);
  const field = (section: DistrictSection) =>
    can(section) ? text(item[section]) : null;
  const rows = <T>(
    raw: unknown,
    map: (row: Record<string, unknown>) => T | null,
  ): T[] =>
    Array.isArray(raw)
      ? raw.map(record).flatMap((row) => (row === null ? [] : (map(row) ?? [])))
      : [];
  const market = record(item.marketData);
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
            dataDate: text(row.dataDate ?? row.date),
            checkedAt: text(row.checkedAt),
          },
          section,
          now,
        ),
    );
  return {
    summary: field("summary"),
    history: field("history"),
    geography: field("geography"),
    life: field("life"),
    transportation: field("transportation"),
    placesGuide: field("placesGuide"),
    distinctiveFeatures: field("distinctiveFeatures"),
    researchTopics: field("researchTopics"),
    facts: can("facts") ? (record(item.facts) as DistrictGuide["facts"]) : null,
    neighborhoods: can("neighborhoods")
      ? rows(item.neighborhoods, (row) => {
          const name = text(row.name);
          return name
            ? {
                name,
                id: text(row.id),
                featured: row.featured === true,
                description: text(row.description),
              }
            : null;
        })
      : [],
    housingTexture: field("housingTexture"),
    regionalAssessment: field("regionalAssessment"),
    marketData:
      can("marketData") &&
      market &&
      marketSource &&
      freshRow(market, "marketData", market.sourceUrl)
        ? (market as DistrictGuide["marketData"])
        : null,
    planningDevelopments: can("planningDevelopments")
      ? rows(item.planningDevelopments, (row) => {
          const title = text(row.title);
          return title &&
            freshRow(row, "planningDevelopments", row.officialSource)
            ? {
                title,
                id: text(row.id),
                summary: text(row.summary),
                neighborhood: text(row.neighborhood),
                date: text(row.date),
                status: text(row.status),
                officialSource: text(row.officialSource),
                checkedAt: text(row.checkedAt),
                needsVerification: row.needsVerification === true,
              }
            : null;
        })
      : [],
    sources: sources.filter((source) =>
      districtSectionOptions.some(
        ({ value }) =>
          reviewed.includes(value) && sourceSupportsSection(source, value, now),
      ),
    ),
    updatedAt: text(item.updatedAt),
  };
}
