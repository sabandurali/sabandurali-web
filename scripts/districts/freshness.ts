// District content freshness (TESTS-INFRA-1). The content gate
// (`check-content.ts`) is evaluated at the latest recorded review, so it
// never changes with the date. Whether reviewed content is still public
// today, or stops being public soon because a dated window (planning rows,
// transport checks, market data) runs out, is answered here instead, by
// comparing the public projection at the review time with the projection at
// a later time. Pure: the caller passes every time explicitly.
import { mapDistrictGuide } from "../../src/content/districts/district-guide-projection";
import type { ResearchRecord } from "./import-core";
import { makeDraft } from "./import-core";

export type FreshnessFinding = {
  district: string;
  /** Top-level key of the public district guide that changes. */
  field: string;
  /** "expired": no longer public at `now`; "expiring": within the warning window. */
  status: "expired" | "expiring";
};

const dayMs = 24 * 60 * 60 * 1000;

function changedFields(
  record: ResearchRecord,
  referenceTime: number,
  at: number,
): string[] {
  const draft = makeDraft(record);
  const before = mapDistrictGuide(draft, referenceTime);
  const after = mapDistrictGuide(draft, at);
  if (!before) return [];
  if (!after) return ["guide"];
  const later = new Map(Object.entries(after));
  return Object.entries(before)
    .filter(
      ([key, value]) =>
        JSON.stringify(value) !== JSON.stringify(later.get(key)),
    )
    .map(([key]) => key);
}

/**
 * Every public field that was public at `referenceTime` and is withheld or
 * reduced at `now` ("expired"), or will be within `warnDays` ("expiring").
 */
export function districtFreshness(
  records: readonly ResearchRecord[],
  referenceTime: number,
  now: number,
  warnDays: number,
): FreshnessFinding[] {
  return records.flatMap((record) => {
    const expired = changedFields(record, referenceTime, now);
    const expiring = changedFields(
      record,
      referenceTime,
      now + warnDays * dayMs,
    ).filter((field) => !expired.includes(field));
    return [
      ...expired.map((field) => ({
        district: record.district,
        field,
        status: "expired" as const,
      })),
      ...expiring.map((field) => ({
        district: record.district,
        field,
        status: "expiring" as const,
      })),
    ];
  });
}
