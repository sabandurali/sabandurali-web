/**
 * Pure selection rules of the home page: which published items it lists and
 * which district guide the atlas puts forward. Kept free of data fetching so
 * the rules are tested without Payload.
 */
import { districts } from "@/content/districts/district-registry";

type Dated = { publishedAt: string | null };

function publicationTime(item: Dated): number {
  if (item.publishedAt === null) return 0;
  const time = Date.parse(item.publishedAt);
  return Number.isFinite(time) ? time : 0;
}

/** Sort comparator: newest publication first; undated items last. */
export function newestPublicationFirst(left: Dated, right: Dated): number {
  return publicationTime(right) - publicationTime(left);
}

/** The `limit` newest items, without changing the input. */
export function selectLatest<T extends Dated>(
  items: readonly T[],
  limit: number,
): T[] {
  return items.toSorted(newestPublicationFirst).slice(0, Math.max(0, limit));
}

type RankedPhoto = Dated & {
  district: string | null;
  districtPhotoCategory: string | null;
  collections: ReadonlyArray<{ slug: string }>;
};

/** Istanbul photos (a district, history, an Istanbul or architecture
 * collection) lead the home selection; the rest follow, newest first. */
export function isIstanbulPhoto(photo: RankedPhoto): boolean {
  return (
    photo.district !== null ||
    photo.districtPhotoCategory === "tarih" ||
    photo.collections.some((collection) =>
      /istanbul|mimari|architecture/i.test(collection.slug),
    )
  );
}

export function selectHomePhotos<T extends RankedPhoto>(
  photos: readonly T[],
  limit: number,
): T[] {
  return photos
    .toSorted(
      (left, right) =>
        Number(isIstanbulPhoto(right)) - Number(isIstanbulPhoto(left)) ||
        newestPublicationFirst(left, right),
    )
    .slice(0, Math.max(0, limit));
}

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
