/*
 * Pagination shared by the Payload repositories, so a fix to the read loop,
 * the batch size or the page clamp reaches every content type.
 */

/** One database page after mapping: the items that survived the mapper. */
export type MappedPage<T> = {
  items: readonly T[];
  totalPages: number;
};

/**
 * Reads pages 1, 2, … until every page is read or, with `limit`, until
 * `limit` mapped items are collected. Records the mapper rejects only cost
 * a further page when they leave the result short.
 */
export async function collectMappedPages<T>(
  read: (page: number) => Promise<MappedPage<T>>,
  limit?: number,
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && (limit === undefined || items.length < limit)) {
    const result = await read(page);
    items.push(...result.items);
    totalPages = result.totalPages;
    page += 1;
  }

  return limit === undefined ? items : items.slice(0, limit);
}

/** Smallest batch a limited read asks for. */
export const MIN_READ_BATCH_SIZE = 10;

/**
 * Rows per query: the full page size without a limit; with one, at least
 * MIN_READ_BATCH_SIZE rows, so a record the mapper rejects (or a limit of
 * 1) does not turn into one round trip per row.
 */
export function getReadBatchSize(
  limit: number | undefined,
  pageSize: number,
): number {
  return limit === undefined
    ? pageSize
    : Math.min(pageSize, Math.max(limit, MIN_READ_BATCH_SIZE));
}

/** A requested page number as a whole page, at least 1. */
export function normalizeRequestedPage(requested: number | undefined): number {
  return requested !== undefined && Number.isFinite(requested)
    ? Math.max(1, Math.floor(requested))
    : 1;
}

/**
 * The requested page clamped to the pages that exist (at least one), and
 * their count. A page past the end shows the last page.
 */
export function clampPage(
  requested: number | undefined,
  totalItems: number,
  pageSize: number,
): { page: number; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    page: Math.min(normalizeRequestedPage(requested), totalPages),
    totalPages,
  };
}
