import type { NavMenuItem } from "@/components/ui/NavMenu";
import type { PublicNavigationLink } from "@/content/navigation/public-types";

export type HeaderNavigationLayout = "bar" | "stack";

const PATH_ORIGIN = "https://header.invalid";

/** "/makaleler/" and "/makaleler?sayfa=2" are the page "/makaleler". */
export function normalizePathname(pathname: string): string {
  const path = pathname.split(/[?#]/, 1)[0] ?? pathname;
  return path.length > 1 ? path.replace(/\/+$/, "") || "/" : path || "/";
}

/**
 * The page a same-site link opens, or null for external, mailto and
 * in-page anchor links ("/hakkimda#biyografi" is a section, not the
 * page: it never carries aria-current, so only one link does).
 */
function getLinkedPathname(link: PublicNavigationLink): string | null {
  const href = link.href;
  if (
    href === null ||
    link.external ||
    !href.startsWith("/") ||
    href.startsWith("//")
  ) {
    return null;
  }
  const url = new URL(href, PATH_ORIGIN);
  if (url.origin !== PATH_ORIGIN || url.hash !== "") return null;
  return normalizePathname(url.pathname);
}

export function isCurrentLink(
  link: PublicNavigationLink,
  pathname: string,
): boolean {
  const linked = getLinkedPathname(link);
  return linked !== null && linked === normalizePathname(pathname);
}

/**
 * The current page lies below this entry's path prefix. The home page ("/",
 * "/en") is only ever current, never an ancestor of every page.
 */
function isWithinPrefix(link: PublicNavigationLink, pathname: string): boolean {
  const prefix = link.activePathPrefix;
  if (prefix === undefined) return false;
  const base = normalizePathname(prefix);
  const path = normalizePathname(pathname);
  if (link.id === "home" || base === "/" || base === "/en") return false;
  return path === base || path.startsWith(`${base}/`);
}

function containsCurrent(
  link: PublicNavigationLink,
  pathname: string,
): boolean {
  return (
    isCurrentLink(link, pathname) ||
    link.children.some((child) => containsCurrent(child, pathname))
  );
}

function toLeaf(link: PublicNavigationLink, pathname: string): NavMenuItem {
  return {
    id: link.id,
    label: link.label,
    href: link.href,
    newTab: link.newTab,
    current: isCurrentLink(link, pathname),
  };
}

/**
 * NavMenu renders two levels below the bar, the second as labelled link
 * groups. A deeper branch (Gayrimenkul & İstanbul → İlçe Rehberi → Avrupa
 * Yakası → 25 districts) is lifted one level: the entry stays a link and
 * each of its branches becomes a group next to it, so no district link is
 * lost. Plain links come first, then the groups.
 */
function toPanelChildren(
  parent: PublicNavigationLink,
  pathname: string,
): NavMenuItem[] {
  const links: NavMenuItem[] = [];
  const groups: NavMenuItem[] = [];
  // The panel opens with the parent's own link ("…: tümü"); a child that
  // repeats it, or repeats a sibling, would be a second link to one page.
  const seen = new Set<string>(parent.href === null ? [] : [parent.href]);
  const isNew = (link: PublicNavigationLink) => {
    if (link.href === null || seen.has(link.href)) return false;
    seen.add(link.href);
    return true;
  };
  // A group keeps its own link (shown as "…: tümü") only when it is new.
  const toGroup = (
    group: PublicNavigationLink,
    keepLink: boolean,
    leaves: readonly PublicNavigationLink[],
  ): NavMenuItem => ({
    ...toLeaf(group, pathname),
    href: keepLink ? group.href : null,
    children: leaves.filter(isNew).map((leaf) => toLeaf(leaf, pathname)),
  });
  const children = parent.children;

  for (const child of children) {
    const branches = child.children;
    const isDeep = branches.some((branch) => branch.children.length > 0);

    if (branches.length === 0 || isDeep) {
      if (isNew(child)) links.push(toLeaf(child, pathname));
      for (const branch of branches) {
        if (branch.children.length === 0) {
          if (isNew(branch)) links.push(toLeaf(branch, pathname));
          continue;
        }
        groups.push(toGroup(branch, isNew(branch), branch.children));
      }
      continue;
    }

    groups.push(toGroup(child, isNew(child), branches));
  }

  return [...links, ...groups];
}

/**
 * Header links → NavMenu items for the current pathname.
 *
 * - `current` (aria-current="page") marks only the link of this exact page.
 * - `active` marks the top-level entry the page belongs to (an article
 *   under Araştırma & Analiz), shown with the signal bar.
 * - The bar leaves out `mobileOnly` entries and the home entry: the
 *   wordmark is the home link on wide screens. The stack (mobile drawer)
 *   keeps them.
 */
export function toNavMenuItems(
  items: readonly PublicNavigationLink[],
  pathname: string,
  layout: HeaderNavigationLayout,
): NavMenuItem[] {
  return items
    .filter((item) =>
      layout === "bar" ? !item.mobileOnly && item.id !== "home" : true,
    )
    .filter((item) => item.href !== null || item.children.length > 0)
    .map((item) => {
      const base = toLeaf(item, pathname);
      const active =
        !base.current &&
        (isWithinPrefix(item, pathname) || containsCurrent(item, pathname));

      return item.children.length === 0
        ? { ...base, active }
        : {
            ...base,
            active,
            children: toPanelChildren(item, pathname),
          };
    });
}
