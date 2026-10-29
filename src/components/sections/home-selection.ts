/**
 * Pure selection rules of the home page: how many published items it lists and
 * which district guide the atlas puts forward. Kept free of data fetching so
 * the rules are tested without Payload.
 */
import { districts } from "@/content/districts/district-registry";

/**
 * How many items each home list shows. The lists are read with these
 * database limits (`getLatestPublishedArticles`,
 * `getLatestPublishedBookReviews`, `getHomePagePhotos`): newest first, and
 * Istanbul photos ahead of the others. The home page never reads a whole
 * collection.
 */
export const homeListLimits = {
  articles: 3,
  books: 3,
  photos: 4,
} as const;

const registryOrder = new Map(
  districts.map((district, index) => [district.slug, index]),
);

/**
 * The guide the home atlas features: a published guide with a public
 * summary. A guide that also has a verified, credited photo is preferred
 * (its card can show the place); otherwise the registry order decides, so
 * the choice is stable between builds. Unknown districts are ignored.
 * Returns null when no guide is published: the page then says so.
 */
export function pickFeaturedDistrict(
  publishedSummaries: ReadonlyMap<string, string>,
  hasVerifiedImage: (slug: string) => boolean,
): string | null {
  const candidates = [...publishedSummaries.entries()]
    .filter(
      ([slug, summary]) => registryOrder.has(slug) && summary.trim() !== "",
    )
    .map(([slug]) => slug);

  const ranked = candidates.toSorted(
    (left, right) =>
      Number(hasVerifiedImage(right)) - Number(hasVerifiedImage(left)) ||
      (registryOrder.get(left) ?? 0) - (registryOrder.get(right) ?? 0),
  );

  return ranked[0] ?? null;
}

/**
 * Shortens a summary for a card: whole words, at most `maxLength`
 * characters, an ellipsis when cut. Text that fits is returned unchanged.
 */
export function excerpt(text: string, maxLength = 220): string {
  const value = text.replace(/\s+/g, " ").trim();
  if (value.length <= maxLength) return value;

  const room = value.slice(0, maxLength - 1);
  const lastSpace = room.lastIndexOf(" ");
  const words = lastSpace > 0 ? room.slice(0, lastSpace) : room;
  return `${words.replace(/[\s,;:–—-]+$/u, "")}…`;
}
