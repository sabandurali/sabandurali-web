import type {
  PublicFooterGroup,
  PublicNavigationLink,
} from "@/content/navigation/public-types";

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
    cmsGroups.flatMap((group) => group.links.map((link) => link.href)),
  );
  const missing: PublicNavigationLink[] = staticGroups
    .flatMap((group) => group.links)
    .filter(
      (link) =>
        link.href !== null &&
        requiredHrefs.includes(link.href) &&
        !present.has(link.href),
    );

  return missing.length === 0
    ? [...cmsGroups]
    : [
        ...cmsGroups,
        { id: "required-footer-links", title: null, links: missing },
      ];
}
