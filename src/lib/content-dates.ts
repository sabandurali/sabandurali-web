/**
 * Content dates shared by the sitemap and JSON-LD, so both report the same
 * moment for the same item.
 */
function toDate(value: string | null | undefined): Date | undefined {
  if (value === null || value === undefined) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

export function getLatestDate(
  dates: Iterable<Date | undefined>,
): Date | undefined {
  let latest: Date | undefined;
  for (const date of dates) {
    if (date !== undefined && (latest === undefined || date > latest)) {
      latest = date;
    }
  }
  return latest;
}

/**
 * When a content item last changed on the site: the later of `updatedAt` and
 * `publishedAt`. A scheduled item is saved before it goes live, so its
 * `updatedAt` predates the day it appears; its URL (and its list page) change
 * at `publishedAt`.
 */
export function getContentLastModified(item: {
  updatedAt: string | null;
  publishedAt: string | null;
}): Date | undefined {
  return getLatestDate([toDate(item.updatedAt), toDate(item.publishedAt)]);
}
