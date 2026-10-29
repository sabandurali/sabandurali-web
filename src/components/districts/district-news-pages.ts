import { getDistrictNewsPath } from "@/content/districts/district-routes";

/** Items per page of a district's news list. */
export const districtNewsPageSize = 12;

/** Page number from the `sayfa` query value; anything invalid is page 1. */
export function parseNewsPage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || !/^\d+$/.test(raw)) return 1;
  const page = Number(raw);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

/** The slice of one page, with the page clamped to the existing pages. */
export function paginateDistrictNews<T>(
  items: readonly T[],
  page: number,
  pageSize = districtNewsPageSize,
): { items: T[]; currentPage: number; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(1, Math.floor(page)), totalPages);
  return {
    items: items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    currentPage,
    totalPages,
  };
}

/** URL of one page of a district's news list; page 1 has no query. */
export function getDistrictNewsPagePath(slug: string, page: number): string {
  const path = getDistrictNewsPath(slug);
  return page > 1 ? `${path}?sayfa=${page}` : path;
}
