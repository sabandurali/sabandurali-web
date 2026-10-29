import type { CollectionBeforeChangeHook } from "payload";
import { isRecord } from "@/content/guards";

/**
 * A publication date the public queries can match: a non-empty string or a
 * Date. Anything else (null, "", undefined) leaves a published record off
 * the site, because every public read filters on `publishedAt <= now`.
 */
function hasPublishedAt(value: unknown): boolean {
  if (value instanceof Date) return Number.isFinite(value.getTime());
  return typeof value === "string" && value.trim() !== "";
}

/**
 * The `publishedAt` a save should store. A record saved as published always
 * gets a date: the editor's own value, else the date it already had (an
 * editor who empties the field of a published record keeps its original
 * date instead of silently taking it off the site), else `now` on the first
 * publication. Drafts keep whatever the editor entered.
 */
export function resolvePublishedAt(
  data: Record<string, unknown>,
  originalDoc: unknown,
  now: Date,
): unknown {
  if (data._status !== "published" || hasPublishedAt(data.publishedAt)) {
    return data.publishedAt;
  }

  const previous = isRecord(originalDoc) ? originalDoc.publishedAt : undefined;

  return hasPublishedAt(previous) ? previous : now.toISOString();
}

/**
 * Shared `beforeChange` hook for every collection whose public queries
 * require `publishedAt <= now` (articles, pages, photos): a published record
 * never ends up without a publication date.
 */
export const ensurePublishedAt: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
}) => {
  const publishedAt = resolvePublishedAt(data, originalDoc, new Date());

  return publishedAt === data.publishedAt ? data : { ...data, publishedAt };
};
