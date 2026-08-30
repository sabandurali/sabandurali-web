import "server-only";
import { cache } from "react";
import { getPayload } from "payload";
import config from "@payload-config";
import { assertProductionPayloadInfrastructure } from "@/lib/payloadInfrastructure";

export type DistrictGuide = {
  history: string | null; life: string | null; transportation: string | null;
  facts: { population?: string | null; populationYear?: number | null; areaKm2?: number | null; neighborhoodCount?: number | null; neighboringDistricts?: string | null; locationSummary?: string | null } | null;
  neighborhoods: Array<{ id?: string | null; name: string; featured?: boolean | null; description?: string | null }>;
  housingTexture: string | null; regionalAssessment: string | null;
  marketData: { salePricePerM2?: number | null; averageRent?: number | null; dataDate?: string | null; source?: string | null; description?: string | null } | null;
  planningDevelopments: Array<{ id?: string | null; title: string; summary?: string | null; neighborhood?: string | null; date?: string | null; status?: string | null; officialSource?: string | null; checkedAt?: string | null }>;
};

function text(value: unknown): string | null { return typeof value === "string" && value.trim() ? value.trim() : null; }
function record(value: unknown): Record<string, unknown> | null { return typeof value === "object" && value !== null ? value as Record<string, unknown> : null; }

function mapGuide(value: unknown): DistrictGuide | null {
  const item = record(value); if (item === null) return null;
  const rows = <T,>(raw: unknown, map: (row: Record<string, unknown>) => T | null): T[] => Array.isArray(raw) ? raw.map(record).flatMap((row) => row === null ? [] : map(row) ?? []) : [];
  return {
    history: text(item.history), life: text(item.life), transportation: text(item.transportation), facts: record(item.facts) as DistrictGuide["facts"],
    neighborhoods: rows(item.neighborhoods, (row) => { const name = text(row.name); return name === null ? null : { id: text(row.id), name, featured: row.featured === true, description: text(row.description) }; }),
    housingTexture: text(item.housingTexture), regionalAssessment: text(item.regionalAssessment), marketData: record(item.marketData) as DistrictGuide["marketData"],
    planningDevelopments: rows(item.planningDevelopments, (row) => { const title = text(row.title); return title === null ? null : { id: text(row.id), title, summary: text(row.summary), neighborhood: text(row.neighborhood), date: text(row.date), status: text(row.status), officialSource: text(row.officialSource), checkedAt: text(row.checkedAt) }; }),
  };
}

export const getDistrictGuide = cache(async (district: string): Promise<DistrictGuide | null> => {
  if (process.env.PAGE_PUBLIC_SOURCE !== "payload") return null;
  assertProductionPayloadInfrastructure();
  const payload = await getPayload({ config });
  const result = await payload.find({ collection: "district-guides", depth: 0, draft: false, locale: "tr", fallbackLocale: false, limit: 1, pagination: false, overrideAccess: false, where: { and: [{ _status: { equals: "published" } }, { district: { equals: district } }, { publishedAt: { less_than_equal: new Date().toISOString() } }] } });
  return result.docs[0] === undefined ? null : mapGuide(result.docs[0]);
});
