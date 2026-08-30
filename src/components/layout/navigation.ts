import {
  contactEmail,
  contactPaths,
  privacyPaths,
} from "@/config/site";
import { articleListPaths } from "@/content/articles/article-routes";
import { bookListPaths } from "@/content/books/book-routes";
import { photoListPaths } from "@/content/photos/photo-routes";
import { getDistrictsBySide } from "@/content/districts/district-registry";
import { getDistrictPath } from "@/content/districts/district-routes";
import { workspaces } from "@/content/workspaces";
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

export function isTurkishWorkspaceNavigationHref(
  href: string | null,
): boolean {
  if (href === null || !href.startsWith("/")) return false;

  const url = new URL(href, "https://navigation.invalid");
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  return (
    pathname === "/calisma-alanlari" ||
    (pathname === "/" && url.hash === "#calismalar")
  );
}

export function isTurkishAboutNavigationHref(href: string | null): boolean {
  if (href === null || !href.startsWith("/")) return false;

  const url = new URL(href, "https://navigation.invalid");
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  return pathname === "/hakkimda" || (pathname === "/" && url.hash === "#hakkimda");
}

function internalLink(
  id: string,
  label: string,
  href: string | null,
  children: PublicNavigationLink[] = [],
): PublicNavigationLink {
  return {
    id,
    href,
    label,
    ...(href !== null ? { activePathPrefix: href } : {}),
    external: false,
    newTab: false,
    children,
  };
}

function districtSideLink(
  side: "avrupa" | "anadolu",
  label: string,
): PublicNavigationLink {
  return internalLink(
    `district-side-${side}`,
    label,
    null,
    getDistrictsBySide(side).map((district) =>
      internalLink(
        `district-${district.slug}`,
        district.name,
        getDistrictPath(district.slug),
      ),
    ),
  );
}

function workspaceNavigationItems(): PublicNavigationLink[] {
  return [
    internalLink(
      "all-workspaces",
      "Tüm Çalışma Alanları",
      "/calisma-alanlari",
    ),
    ...workspaces.map((workspace) =>
      internalLink(
        `workspace-${workspace.key}`,
        workspace.title,
        `/${workspace.key}`,
        workspace.entries.map((entry) =>
          internalLink(
            `workspace-${workspace.key}-${entry.slug}`,
            entry.title,
            entry.href,
            entry.href === "/istanbul/ilceler"
              ? [
                  districtSideLink("avrupa", "Avrupa Yakası — 25"),
                  districtSideLink("anadolu", "Anadolu Yakası — 14"),
                ]
              : [],
          ),
        ),
      ),
    ),
  ];
}

function aboutNavigationItems(): PublicNavigationLink[] {
  return [
    internalLink("about", "Hakkımda", "/hakkimda"),
    internalLink("biography", "Biyografi", "/hakkimda/biyografi"),
    internalLink(
      "education-certificates-diplomas",
      "Eğitim, Sertifikalar & Diplomalar",
      "/hakkimda/egitim-sertifikalar-diplomalar",
    ),
  ];
}

function articleNavigationItems(): PublicNavigationLink[] {
  return [
    internalLink("all-articles", "Tüm Makaleler", "/makaleler"),
    ...workspaces.slice(0, 5).map((workspace) =>
      internalLink(
        `articles-${workspace.key}`,
        workspace.title,
        `/${workspace.key}`,
      ),
    ),
  ];
}

function booksNavigationItems(): PublicNavigationLink[] {
  const workspace = workspaces.find(
    (candidate) => candidate.key === "kitaplar-ve-ogrenme",
  );

  return [
    internalLink("all-books", "Tüm Kitaplar", "/kitaplar"),
    ...(workspace?.entries.map((entry) =>
      internalLink(`books-${entry.slug}`, entry.title, entry.href),
    ) ?? []),
  ];
}

function photographyNavigationItems(): PublicNavigationLink[] {
  const workspace = workspaces.find(
    (candidate) => candidate.key === "fotograf",
  );

  return [
    internalLink("all-photos", "Tüm Fotoğraflar", "/fotograflar"),
    ...(workspace?.entries.map((entry) =>
      internalLink(`photos-${entry.slug}`, entry.title, entry.href),
    ) ?? []),
  ];
}

export function withTurkishHeaderShortcuts(
  items: PublicNavigationLink[],
): PublicNavigationLink[] {
  const aboutChildren = aboutNavigationItems();
  const workspacesChildren = workspaceNavigationItems();
  const shortcutChildren = new Map<string, PublicNavigationLink[]>([
    ["/makaleler", articleNavigationItems()],
    ["/kitaplar", booksNavigationItems()],
    ["/fotograflar", photographyNavigationItems()],
  ]);

  return items.map((item) => {
    if (isTurkishAboutNavigationHref(item.href)) {
      return {
        ...item,
        href: "/hakkimda",
        activePathPrefix: "/hakkimda",
        children: aboutChildren,
      };
    }

    if (isTurkishWorkspaceNavigationHref(item.href)) {
      return { ...item, children: workspacesChildren };
    }

    const children =
      item.href === null ? undefined : shortcutChildren.get(item.href);
    return children === undefined ? item : { ...item, children };
  });
}

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
    content.navigation.books !== undefined
      ? [
          {
            id: "books",
            href: bookListPaths[locale],
            label: content.navigation.books,
            activePathPrefix: bookListPaths[locale],
            external: false,
            newTab: false,
            children: [],
          },
        ]
      : [];
  const items = [
    {
      id: "about",
      href: locale === "tr" ? "/hakkimda" : `${anchorPrefix}#${anchors.about}`,
      label: content.navigation.about,
      activePathPrefix: locale === "tr" ? "/hakkimda" : undefined,
      external: false,
      newTab: false,
      children: [],
    },
    {
      id: "work",
      href: locale === "tr" ? "/calisma-alanlari" : `${anchorPrefix}#${anchors.work}`,
      label: content.navigation.work,
      activePathPrefix: locale === "tr" ? "/calisma-alanlari" : undefined,
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
      id: "photography",
      href: photoListPaths[locale],
      label: content.navigation.photography,
      activePathPrefix: photoListPaths[locale],
      external: false,
      newTab: false,
      children: [],
    },
    {
      id: "contact",
      href: contactPaths[locale],
      label: content.navigation.contact,
      external: false,
      newTab: false,
      children: [],
    },
  ];

  return locale === "tr" ? withTurkishHeaderShortcuts(items) : items;
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
