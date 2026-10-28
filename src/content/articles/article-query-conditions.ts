import type { Where } from "payload";

export type PublicArticleFilter =
  | { kind: "standalone" }
  | { kind: "category"; categorySlug: string }
  | {
      kind: "district";
      articleType: "district-research" | "district-news";
      district: string;
    };

/**
 * Database conditions for public article reads, so pages never load a whole
 * collection to filter it in memory. Payload access control and the mapper
 * re-check publication. District news never has a standalone article page:
 * it is only listed on its district page with a link to the original source.
 *
 * Title, slug and excerpt are localized and Payload evaluates conditions on
 * localized fields in the query locale, so an article that has not been
 * translated into that locale is skipped by the database instead of being
 * loaded (and reported) by the mapper on every English list or lookup.
 */
export function createPublicArticleConditions(
  now: Date,
  filter: PublicArticleFilter,
): Where[] {
  const published: Where[] = [
    { _status: { equals: "published" } },
    { publishedAt: { less_than_equal: now.toISOString() } },
    { title: { exists: true } },
    { slug: { exists: true } },
    { excerpt: { exists: true } },
  ];

  switch (filter.kind) {
    case "standalone":
      return [...published, { articleType: { not_equals: "district-news" } }];
    case "category":
      return [
        ...published,
        { articleType: { not_equals: "district-news" } },
        { "categories.slug": { equals: filter.categorySlug } },
      ];
    case "district":
      return [
        ...published,
        { articleType: { equals: filter.articleType } },
        { district: { equals: filter.district } },
      ];
  }
}
