import { contactPaths, feedbackPaths } from "@/config/site";
import { articleListPaths } from "@/content/articles/article-routes";
import type {
  HeaderContent,
  HomeAnchors,
  Locale,
} from "@/content/homeContent";

export type HeaderNavigationVariant = "desktop" | "mobile";

export type HeaderNavigationItem = {
  id: "about" | "work" | "articles" | "contact" | "feedback";
  href: string;
  label: string;
  activePathPrefix?: string;
  mobileOnly?: boolean;
};

type GetHeaderNavigationItemsOptions = {
  locale: Locale;
  anchors: HomeAnchors;
  content: HeaderContent;
  anchorPrefix: string;
  variant: HeaderNavigationVariant;
};

export function getHeaderNavigationItems({
  locale,
  anchors,
  content,
  anchorPrefix,
  variant,
}: GetHeaderNavigationItemsOptions): ReadonlyArray<HeaderNavigationItem> {
  const items: ReadonlyArray<HeaderNavigationItem> = [
    {
      id: "about",
      href: `${anchorPrefix}#${anchors.about}`,
      label: content.navigation.about,
    },
    {
      id: "work",
      href: `${anchorPrefix}#${anchors.work}`,
      label: content.navigation.work,
    },
    {
      id: "articles",
      href: articleListPaths[locale],
      label: content.navigation.articles,
      activePathPrefix: articleListPaths[locale],
    },
    {
      id: "contact",
      href: contactPaths[locale],
      label: content.navigation.contact,
    },
    {
      id: "feedback",
      href: feedbackPaths[locale],
      label: content.navigation.feedback,
      mobileOnly: true,
    },
  ];

  return variant === "mobile"
    ? items
    : items.filter((item) => !item.mobileOnly);
}

export function isHeaderNavigationItemActive(
  item: HeaderNavigationItem,
  pathname: string,
): boolean {
  const prefix = item.activePathPrefix;

  return prefix !== undefined
    && (pathname === prefix || pathname.startsWith(`${prefix}/`));
}
