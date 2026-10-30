import type { PhotoListFilters } from "@/content/photos/types";

export type PhotoListSearchParams = Record<
  string,
  string | string[] | undefined
>;

/** Longest slug or page value read from the query string. */
const maxValueLength = 120;

function single(value: string | string[] | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" || trimmed.length > maxValueLength
    ? undefined
    : trimmed;
}

/**
 * Filters of the photograph list from its query string. Repeated or empty
 * values are ignored, and `page` must be a positive integer written in
 * digits ("2", not "2.0" or "1e3"), so every list URL maps to one result.
 */
export function parsePhotoListParams(
  query: PhotoListSearchParams,
): PhotoListFilters {
  const collection = single(query.collection);
  const tag = single(query.tag);
  const pageValue = single(query.page);
  const page =
    pageValue !== undefined && /^[1-9]\d{0,5}$/.test(pageValue)
      ? Number(pageValue)
      : undefined;

  return {
    ...(collection === undefined ? {} : { collection }),
    ...(tag === undefined ? {} : { tag }),
    ...(page === undefined || page === 1 ? {} : { page }),
  };
}
