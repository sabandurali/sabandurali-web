import {
  isExternalNavigationHref,
  normalizeExternalNavigationUrl,
  normalizeInternalNavigationPath,
} from "@/content/navigation/navigation-links";
import type {
  PublicFooterGroup,
  PublicNavigation,
  PublicNavigationLink,
} from "@/content/navigation/public-types";
import type {
  Navigation as PayloadNavigation,
  Page as PayloadPage,
} from "@/payload-types";

type PayloadHeaderItem = NonNullable<
  PayloadNavigation["headerItems"]
>[number];
type PayloadChildItem = NonNullable<PayloadHeaderItem["children"]>[number];
type PayloadFooterGroup = NonNullable<
  PayloadNavigation["footerGroups"]
>[number];
type PayloadFooterLink = NonNullable<PayloadFooterGroup["links"]>[number];
type PayloadLink = PayloadHeaderItem | PayloadChildItem | PayloadFooterLink;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function isPublicTurkishPage(
  value: unknown,
  now: Date,
): value is PayloadPage {
  if (!isRecord(value)) return false;

  const publishedAt =
    typeof value.publishedAt === "string"
      ? Date.parse(value.publishedAt)
      : Number.NaN;

  return (
    value.language === "tr" &&
    value._status === "published" &&
    Number.isFinite(publishedAt) &&
    publishedAt <= now.getTime() &&
    getText(value.slug) !== null &&
    (value.pageType === "home" || value.pageType === "standard")
  );
}

function resolvePageHref(value: unknown, now: Date): string | null {
  if (!isPublicTurkishPage(value, now)) return null;

  return value.pageType === "home" ? "/" : `/${value.slug}`;
}

function resolveHref(
  item: PayloadLink,
  allowContactProtocols: boolean,
  now: Date,
): string | null {
  if (item.linkType === "page") {
    return resolvePageHref(item.page, now);
  }

  if (item.linkType === "internal") {
    return normalizeInternalNavigationPath(item.internalPath);
  }

  return normalizeExternalNavigationUrl(
    item.externalUrl,
    allowContactProtocols,
  );
}

function mapLink(
  item: PayloadLink,
  index: number,
  options: {
    allowContactProtocols: boolean;
    allowChildren: boolean;
    now: Date;
    parentID?: string;
  },
): PublicNavigationLink | null {
  if (item.active === false) return null;

  const label = getText(item.label);
  if (label === null) return null;

  const id =
    getText(item.id) ??
    `${options.parentID ?? "navigation"}-${index + 1}`;
  const href = resolveHref(
    item,
    options.allowContactProtocols,
    options.now,
  );
  const children =
    options.allowChildren && "children" in item
      ? item.children?.flatMap((child, childIndex) => {
          const mapped = mapLink(child, childIndex, {
            allowContactProtocols: false,
            allowChildren: false,
            now: options.now,
            parentID: id,
          });
          return mapped === null ? [] : [mapped];
        }) ?? []
      : [];

  if (href === null && children.length === 0) return null;

  const external =
    href !== null && isExternalNavigationHref(href);

  return {
    id,
    label,
    href,
    external,
    newTab:
      external &&
      href?.startsWith("https://") === true &&
      item.newTab === true,
    ...(href !== null && !external && !href.includes("#")
      ? { activePathPrefix: href }
      : {}),
    children,
  };
}

function mapFooterGroups(
  groups: PayloadNavigation["footerGroups"],
  now: Date,
): PublicFooterGroup[] {
  return (
    groups?.flatMap((group, groupIndex) => {
      if (group.active === false) return [];

      const title = getText(group.title);
      if (title === null) return [];

      const groupID =
        getText(group.id) ?? `footer-group-${groupIndex + 1}`;
      const links =
        group.links?.flatMap((link, linkIndex) => {
          const mapped = mapLink(link, linkIndex, {
            allowContactProtocols: true,
            allowChildren: false,
            now,
            parentID: groupID,
          });
          return mapped === null ? [] : [mapped];
        }) ?? [];

      return links.length === 0
        ? []
        : [{ id: groupID, title, links }];
    }) ?? []
  );
}

export function mapPayloadNavigation(
  value: PayloadNavigation,
  now: Date = new Date(),
): PublicNavigation | null {
  if (value._status !== "published") return null;

  return {
    headerItems:
      value.headerItems?.flatMap((item, index) => {
        const mapped = mapLink(item, index, {
          allowContactProtocols: false,
          allowChildren: true,
          now,
        });
        return mapped === null ? [] : [mapped];
      }) ?? [],
    footerGroups: mapFooterGroups(value.footerGroups, now),
  };
}
