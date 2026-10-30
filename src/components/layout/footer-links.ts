import type { SiteLocale } from "@/content/locales";
import type {
  PublicFooterGroup,
  PublicNavigationLink,
} from "@/content/navigation/public-types";

export type FooterLink = {
  id: string;
  label: string;
  href: string;
  newTab: boolean;
  /** Set when the label is in the other language ("English", "Türkçe"). */
  lang?: SiteLocale;
};

export type FooterLinkGroup = {
  /** DOM-safe id, unique on the page. */
  id: string;
  title: string | null;
  links: FooterLink[];
};

function flatten(links: readonly PublicNavigationLink[]): FooterLink[] {
  return links.flatMap((link) => [
    ...(link.href === null
      ? []
      : [
          {
            id: link.id,
            label: link.label,
            href: link.href,
            newTab: link.newTab,
            ...(link.lang === undefined ? {} : { lang: link.lang }),
          },
        ]),
    ...flatten(link.children),
  ]);
}

/**
 * Footer groups as rendered: one flat list of real links per group (nested
 * CMS links are listed after their parent, a label without a link is
 * dropped) and no empty group, so the footer never shows a heading over
 * nothing. Ids come from the position, not from CMS data.
 */
export function getFooterLinkGroups(
  groups: readonly PublicFooterGroup[],
): FooterLinkGroup[] {
  return groups
    .map((group) => ({ title: group.title, links: flatten(group.links) }))
    .filter((group) => group.links.length > 0)
    .map((group, index) => ({ id: String(index + 1), ...group }));
}
