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
>[number] | NonNullable<
  PayloadNavigation["enHeader"]
>[number];
type PayloadChildItem = NonNullable<PayloadHeaderItem["children"]>[number];
type PayloadFooterGroup = NonNullable<
  PayloadNavigation["footerGroups"]
>[number] | NonNullable<
  PayloadNavigation["enFooter"]
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

function isPublicPage(
  value: unknown,
  language: "en" | "tr",
  now: Date,
): value is PayloadPage {
  if (!isRecord(value)) return false;

  const publishedAt =
    typeof value.publishedAt === "string"
      ? Date.parse(value.publishedAt)
      : Number.NaN;

  return (
    value.language === language &&
    value._status === "published" &&
    Number.isFinite(publishedAt) &&
    publishedAt <= now.getTime() &&
    getText(value.slug) !== null &&
    (value.pageType === "home" || value.pageType === "standard")
  );
}

function resolvePageHref(
  value: unknown,
  language: "en" | "tr",
  now: Date,
): string | null {
  if (!isPublicPage(value, language, now)) return null;

  const localePrefix = language === "en" ? "/en" : "";

  return value.pageType === "home"
    ? localePrefix || "/"
    : `${localePrefix}/${value.slug}`;
}

function resolveHref(
  item: PayloadLink,
  allowContactProtocols: boolean,
  language: "en" | "tr",
  now: Date,
): string | null {
  if (item.linkType === "page") {
    return resolvePageHref(item.page, language, now);
  }

  if (item.linkType === "internal") {
    return normalizeInternalNavigationPath(item.internalPath);
  }

  return normalizeExternalNavigationUrl(
    item.externalUrl,
    allowContactProtocols,
  );
}

function isRetiredFeedbackHref(href: string | null): boolean {
  return href === "/geri-bildirim" || href === "/en/feedback";
}

function mapLink(
  item: PayloadLink,
  index: number,
  options: {
    allowContactProtocols: boolean;
    allowChildren: boolean;
    language: "en" | "tr";
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
    options.language,
    options.now,
  );

  if (isRetiredFeedbackHref(href)) return null;

  const children =
    options.allowChildren && "children" in item
      ? item.children?.flatMap((child, childIndex) => {
          const mapped = mapLink(child, childIndex, {
            allowContactProtocols: false,
            allowChildren: false,
            language: options.language,
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
  groups:
    | PayloadNavigation["footerGroups"]
    | PayloadNavigation["enFooter"],
  language: "en" | "tr",
  now: Date,
): PublicFooterGroup[] {
  return (
    groups?.flatMap((group, groupIndex) => {
      if (group.active === false) return [];

      const title = getText(group.title);

      const groupID =
        getText(group.id) ?? `footer-group-${groupIndex + 1}`;
      const links =
        group.links?.flatMap((link, linkIndex) => {
          const mapped = mapLink(link, linkIndex, {
            allowContactProtocols: true,
            allowChildren: false,
            language,
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
  language: "en" | "tr",
  now: Date = new Date(),
): PublicNavigation | null {
  if (value._status !== "published") return null;

  const headerItems =
    language === "en" ? value.enHeader : value.headerItems;
  const footerGroups =
    language === "en" ? value.enFooter : value.footerGroups;

  return {
    headerItems:
      headerItems?.flatMap((item, index) => {
        const mapped = mapLink(item, index, {
          allowContactProtocols: false,
          allowChildren: true,
          language,
          now,
        });
        return mapped === null ? [] : [mapped];
      }) ?? [],
    footerGroups: mapFooterGroups(footerGroups, language, now),
  };
}
