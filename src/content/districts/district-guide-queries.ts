import type { Where } from "payload";

/**
 * The `where` and `sort` arguments of every district-guides query in the
 * content layer. They run with `overrideAccess: false`, so the anonymous
 * query allowlist (`PUBLIC_DISTRICT_GUIDE_QUERY_PATHS` in
 * `src/collections/DistrictGuides.ts`) applies to them; the test of this
 * module keeps them inside it.
 */
export function publishedDistrictGuidesWhere(
  now: Date,
  district?: string,
): Where {
  return {
    and: [
      { _status: { equals: "published" } },
      { publishedAt: { less_than_equal: now.toISOString() } },
      ...(district === undefined ? [] : [{ district: { equals: district } }]),
    ],
  };
}

export const DISTRICT_GUIDE_SORT = "district";
