import { getAbsoluteUrl } from "@/config/site";
import { homeCrumb } from "@/content/home-crumb";
import type { SiteLocale } from "@/content/locales";

/** One step of a page's trail: the name the visible breadcrumb shows. */
export type BreadcrumbTrailItem = { name: string; path: string };

/**
 * A trail that starts at the home page of `locale`, named like the visible
 * breadcrumb's first item (`homeCrumb`, the label the UI also uses).
 */
export function createHomeTrail(
  locale: SiteLocale,
  ...items: readonly BreadcrumbTrailItem[]
): BreadcrumbTrailItem[] {
  return [homeCrumb[locale], ...items];
}

/**
 * The schema.org BreadcrumbList of one page, from the same trail the
 * visible breadcrumb shows. The last item is the page itself, so its URL is
 * the page's own (canonical) address; the node's `@id` is that URL with a
 * `#breadcrumb` fragment, which a `WebPage` node can reference.
 */
export function createBreadcrumbJsonLd(trail: readonly BreadcrumbTrailItem[]) {
  const last = trail.at(-1);
  if (last === undefined) {
    throw new Error("A breadcrumb trail needs at least the current page.");
  }

  return {
    "@type": "BreadcrumbList",
    "@id": `${getAbsoluteUrl(last.path)}#breadcrumb`,
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getAbsoluteUrl(item.path),
    })),
  } as const;
}
