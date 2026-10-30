/**
 * Pure checks behind the editor dashboard (ADM-DASHBOARD). The dashboard
 * reads the documents with the editor's own access and passes them here.
 */
import { mapDistrictGuide } from "@/content/districts/district-guide-projection";
import { getDistrict } from "@/content/districts/district-registry";
import { getText, isRecord } from "@/content/guards";

const dayMs = 24 * 60 * 60 * 1000;

/** How far ahead the dashboard looks for district data that runs out. */
export const DISTRICT_FRESHNESS_WARN_DAYS = 30;

export type DashboardItem = Readonly<{ id: string; title: string }>;

function getID(doc: Record<string, unknown>): string | null {
  const id = doc.id;
  return typeof id === "string" || typeof id === "number" ? String(id) : null;
}

function localized(value: unknown, locale: "en" | "tr"): string | null {
  return isRecord(value) ? getText(value[locale]) : getText(value);
}

/**
 * Published articles and photos (read with `locale: "all"`) whose English
 * version is missing a field the English pages need, so they never appear
 * under `/en`. District news are Turkish only and are skipped.
 */
export function findMissingEnglish(
  collection: "articles" | "photos",
  docs: readonly unknown[],
): DashboardItem[] {
  const required =
    collection === "articles"
      ? (["title", "slug", "excerpt"] as const)
      : (["title", "slug", "altText"] as const);

  return docs.flatMap((doc): DashboardItem[] => {
    if (!isRecord(doc)) return [];
    if (collection === "articles" && doc.articleType === "district-news") {
      return [];
    }
    const id = getID(doc);
    const title = localized(doc.title, "tr") ?? localized(doc.title, "en");
    if (id === null || title === null) return [];
    return required.some((field) => localized(doc[field], "en") === null)
      ? [{ id, title }]
      : [];
  });
}

export type MediaGap = DashboardItem & {
  missingAlt: boolean;
  missingCredit: boolean;
};

/** Media without alt text or without a source / copyright line. */
export function findMediaGaps(docs: readonly unknown[]): MediaGap[] {
  return docs.flatMap((doc): MediaGap[] => {
    if (!isRecord(doc)) return [];
    const id = getID(doc);
    if (id === null) return [];
    const missingAlt = getText(doc.alt) === null;
    const missingCredit = getText(doc.sourceCopyright) === null;
    return missingAlt || missingCredit
      ? [
          {
            id,
            missingAlt,
            missingCredit,
            title: getText(doc.filename) ?? id,
          },
        ]
      : [];
  });
}

export type DistrictFreshnessItem = DashboardItem & {
  /** Top-level keys of the public guide that change within the window. */
  fields: string[];
};

/**
 * Published district guides whose public content shrinks within
 * `warnDays`: a dated source, planning row or market figure falls out of
 * its window, so the public projection at `now + warnDays` differs from
 * the one at `now`. The same projection as the public page decides.
 */
export function findExpiringDistrictData(
  docs: readonly unknown[],
  now: number,
  warnDays: number = DISTRICT_FRESHNESS_WARN_DAYS,
): DistrictFreshnessItem[] {
  const later = now + warnDays * dayMs;

  return docs.flatMap((doc): DistrictFreshnessItem[] => {
    if (!isRecord(doc)) return [];
    const id = getID(doc);
    const slug = getText(doc.district);
    if (id === null || slug === null) return [];

    const before = mapDistrictGuide(doc, now);
    if (before === null) return [];
    const after = mapDistrictGuide(doc, later);
    const afterEntries = new Map(Object.entries(after ?? {}));
    const fields =
      after === null
        ? ["guide"]
        : Object.entries(before)
            .filter(
              ([key, value]) =>
                JSON.stringify(value) !== JSON.stringify(afterEntries.get(key)),
            )
            .map(([key]) => key);

    return fields.length === 0
      ? []
      : [{ fields, id, title: getDistrict(slug)?.name ?? slug }];
  });
}
