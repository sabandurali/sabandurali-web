import type {
  PublicFooterGroup,
  PublicNavigationLink,
} from "@/content/navigation/public-types";

/**
 * The page a footer href points to: "/iletisim/", "/iletisim?x" and
 * "/iletisim#form" all mean the contact page, so a CMS link written that way
 * does not get a duplicate static link next to it.
 */
function getLinkedPath(href: string): string {
  const path = href.split(/[?#]/, 1)[0] ?? href;
  return path.length > 1 ? path.replace(/\/+$/, "") || "/" : path;
}

function collectHrefs(links: ReadonlyArray<PublicNavigationLink>): string[] {
  return links.flatMap((link) => [
    ...(link.href === null ? [] : [getLinkedPath(link.href)]),
    ...collectHrefs(link.children),
  ]);
}

/**
 * The footer must always offer the privacy notice (KVKK) and the contact
 * page, whatever the CMS navigation contains. When the CMS footer is empty
 * or the Navigation global is not published, the static footer is used;
 * when CMS groups exist but miss a required link, the missing static links
 * are appended in their own group.
 */
export function resolveFooterGroups(
  cmsGroups: ReadonlyArray<PublicFooterGroup> | null,
  staticGroups: ReadonlyArray<PublicFooterGroup>,
  requiredHrefs: ReadonlyArray<string>,
): PublicFooterGroup[] {
  if (cmsGroups === null || cmsGroups.length === 0) return [...staticGroups];

  const present = new Set(
    cmsGroups.flatMap((group) => collectHrefs(group.links)),
  );
  const missing: PublicNavigationLink[] = staticGroups
    .flatMap((group) => group.links)
    .filter(
      (link) =>
        link.href !== null &&
        requiredHrefs.includes(link.href) &&
        !present.has(getLinkedPath(link.href)),
    );

  return missing.length === 0
    ? [...cmsGroups]
    : [
        ...cmsGroups,
        { id: "required-footer-links", title: null, links: missing },
      ];
}

/**
 * The footer site map first, then the CMS or static footer groups. A site
 * map link whose page the following groups already link is dropped, so the
 * footer names a page once, and a site map group left empty is dropped.
 */
export function withFooterSitemap(
  sitemapGroups: ReadonlyArray<PublicFooterGroup>,
  groups: ReadonlyArray<PublicFooterGroup>,
): PublicFooterGroup[] {
  const present = new Set(groups.flatMap((group) => collectHrefs(group.links)));
  const sitemap = sitemapGroups
    .map((group) => ({
      ...group,
      links: group.links.filter(
        (link) => link.href === null || !present.has(getLinkedPath(link.href)),
      ),
    }))
    .filter((group) => group.links.length > 0);
  return [...sitemap, ...groups];
}
