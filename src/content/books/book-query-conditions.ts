import type { Where } from "payload";

/**
 * Database conditions for public book review reads: published, approved
 * for publication, indexable and not scheduled. The mapper re-checks them.
 */
export function createPublicBookReviewConditions(now: Date): Where[] {
  return [
    { _status: { equals: "published" } },
    { reviewStatus: { equals: "published" } },
    { publishedAt: { less_than_equal: now.toISOString() } },
    { "seo.index": { equals: true } },
  ];
}
