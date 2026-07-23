import {
  contactEmail,
  contactPaths,
  feedbackPaths,
  privacyPaths,
} from "@/config/site";
import { articleListPaths } from "@/content/articles/article-routes";
import { bookListPaths } from "@/content/books/book-routes";
import type {
  PublicFooterGroup,
  PublicNavigationLink,
} from "@/content/navigation/public-types";
import type {
  FooterContent,
  HeaderContent,
  HomeAnchors,
  Locale,
} from "@/content/homeContent";

export type HeaderNavigationVariant = "desktop" | "mobile";

type GetStaticHeaderNavigationItemsOptions = {
  locale: Locale;
  anchors: HomeAnchors;
  content: HeaderContent;
  anchorPrefix: string;
};

export function getStaticHeaderNavigationItems({
  locale,
  anchors,
  content,
  anchorPrefix,
}: GetStaticHeaderNavigationItemsOptions): PublicNavigationLink[] {
  const booksItems: PublicNavigationLink[] =
    locale === "tr" && content.navigation.books !== undefined
      ? [
          {
            id: "books",
            href: bookListPaths.tr,
            label: content.navigation.books,
            activePathPrefix: bookListPaths.tr,
            external: false,
            newTab: false,
            children: [],
          },
        ]
      : [];
  return [
    {
      id: "about",
      href: `${anchorPrefix}#${anchors.about}`,
      label: content.navigation.about,
      external: false,
      newTab: false,
      children: [],
    },
    {
      id: "work",
      href: `${anchorPrefix}#${anchors.work}`,
      label: content.navigation.work,
      external: false,
      newTab: false,
      children: [],
    },
    {
      id: "articles",
      href: articleListPaths[locale],
      label: content.navigation.articles,
      activePathPrefix: articleListPaths[locale],
      external: false,
      newTab: false,
      children: [],
    },
    ...booksItems,
    {
      id: "contact",
      href: contactPaths[locale],
      label: content.navigation.contact,
      external: false,
      newTab: false,
      children: [],
    },
    {
      id: "feedback",
      href: feedbackPaths[locale],
      label: content.navigation.feedback,
      mobileOnly: true,
      external: false,
      newTab: false,
      children: [],
    },
  ];
}

export function getStaticFooterGroups(
  content: FooterContent,
): PublicFooterGroup[] {
  return [
    {
      id: "static-footer-links",
      title: null,
      links: [
        {
          id: "footer-contact",
          href: contactPaths[content.locale],
          label: content.links.contact,
          external: false,
          newTab: false,
          children: [],
        },
        {
          id: "footer-feedback",
          href: feedbackPaths[content.locale],
          label: content.links.feedback,
          external: false,
          newTab: false,
          children: [],
        },
        {
          id: "footer-privacy",
          href: privacyPaths[content.locale],
          label: content.links.privacy,
          external: false,
          newTab: false,
          children: [],
        },
        {
          id: "footer-email",
          href: `mailto:${contactEmail}`,
          label: `${content.links.email}: ${contactEmail}`,
          external: true,
          newTab: false,
          children: [],
        },
      ],
    },
  ];
}

export function isHeaderNavigationItemActive(
  item: PublicNavigationLink,
  pathname: string,
): boolean {
  const prefix = item.activePathPrefix;

  const ownActive =
    prefix === "/"
      ? pathname === "/"
      : prefix !== undefined &&
        (pathname === prefix || pathname.startsWith(`${prefix}/`));

  return (
    ownActive ||
    item.children.some((child) =>
      isHeaderNavigationItemActive(child, pathname),
    )
  );
}
