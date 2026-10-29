/** One page of a public query: the mapped documents and the page count. */
export type PublicDocumentPage = {
  photos: readonly unknown[];
  totalPages: number;
};

/**
 * Page size of the scan that follows a rejected newest document. Large
 * enough that a run of rejected documents costs a few queries instead of one
 * query per row (SEO-PERF-4), small enough to stay a light read.
 */
export const HAS_PUBLIC_SCAN_PAGE_SIZE = 25;

/**
 * Whether a query has at least one document the mapper accepts. Usually one
 * one-row query (the newest document). Only when the mapper rejects that
 * document (it is logged) are the documents read again in larger pages.
 */
export async function hasPublicDocument(
  findPage: (page: number, pageSize: number) => Promise<PublicDocumentPage>,
): Promise<boolean> {
  const newest = await findPage(1, 1);
  if (newest.photos.length > 0) return true;
  if (newest.totalPages <= 1) return false;

  let totalPages = 1;
  for (let page = 1; page <= totalPages; page += 1) {
    const result = await findPage(page, HAS_PUBLIC_SCAN_PAGE_SIZE);
    if (result.photos.length > 0) return true;
    totalPages = result.totalPages;
  }
  return false;
}
