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

/** The page a list shows, after a request past the end was clamped. */
export type ClampedPage<R> = {
  /** The read of `page`. */
  result: R;
  page: number;
  totalPages: number;
  totalItems: number;
};

/**
 * Reads the requested page of a list; a page past the end reads the last
 * page instead. Past the end Payload returns no documents and, when the
 * query joins other tables (localized fields, relationship filters), a
 * total of 0 as well, so page 1 supplies the real total before the last
 * page is read. `found` is the number of database rows a read returned.
 */
export async function readClampedPage<R extends { totalDocs: number }>(
  read: (page: number) => Promise<R>,
  found: (result: R) => number,
  requestedPage: number | undefined,
  pageSize: number,
): Promise<ClampedPage<R>> {
  const requested = normalizeRequestedPage(requestedPage);
  const requestedResult = await read(requested);
  const first =
    requested === 1 || found(requestedResult) > 0
      ? requestedResult
      : await read(1);
  const { page, totalPages } = clampPage(requested, first.totalDocs, pageSize);
  const result =
    page === requested
      ? requestedResult
      : page === 1
        ? first
        : await read(page);

  return { result, page, totalPages, totalItems: first.totalDocs };
}
