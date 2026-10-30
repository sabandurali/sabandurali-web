import { contactEmail, contactPaths, privacyPaths } from "@/config/site";
import { articleListPaths } from "@/content/articles/article-routes";
import { bookListPaths } from "@/content/books/book-routes";
import { photoListPaths } from "@/content/photos/photo-routes";
import { getDistrictsBySide } from "@/content/districts/district-registry";
import {
  districtGuidePath,
  getDistrictPath,
} from "@/content/districts/district-routes";
import { workspacePath, workspaces } from "@/content/workspaces";
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

/*
 * Static navigation data (ARC-7): the header and footer links used when
 * NAVIGATION_PUBLIC_SOURCE is "static" or the Navigation global is not
 * published, plus the fixed Turkish header shortcuts and the English header,
 * which are always defined in code. Presentation (current page, desktop or
 * mobile layout) lives in src/components/layout.
 */

export function isTurkishAboutNavigationHref(href: string | null): boolean {
  if (href === null || !href.startsWith("/")) return false;

  const url = new URL(href, "https://navigation.invalid");
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  return (
    pathname === "/hakkimda" || (pathname === "/" && url.hash === "#hakkimda")
  );
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

function englishHomeAnchorLink(
  id: string,
  label: string,
  hash: string,
): PublicNavigationLink {
  return {
    id,
    href: `/en#${hash}`,
    label,
    external: false,
    newTab: false,
    children: [],
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

function workspacePrimaryNavigationItems(): PublicNavigationLink[] {
  return workspaces.map((workspace) =>
    internalLink(
      `workspace-${workspace.key}`,
      workspace.title,
      `/${workspace.key}`,
      workspace.entries
        .filter((entry) => entry.slug !== "hesaplama-araclari")
        .map((entry) =>
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
  );
}

function aboutNavigationItems(): PublicNavigationLink[] {
  return [
    internalLink("about", "Hakkımda", "/hakkimda"),
    internalLink("biography", "Biyografi", "/hakkimda#biyografi"),
    internalLink(
      "education-certificates-diplomas",
      "Eğitim",
      "/hakkimda#egitim-sertifikalar",
    ),
  ];
}

export function withTurkishHeaderShortcuts(
  items: PublicNavigationLink[],
): PublicNavigationLink[] {
  const about = items.find((item) => isTurkishAboutNavigationHref(item.href));
  const contact = items.find((item) => item.href === contactPaths.tr);
  const primaryWorkspaceKeys = [
    "gayrimenkul-ve-istanbul",
    "arastirma-ve-analiz",
    "satis-ve-muzakere",
    "yapay-zeka-ve-teknoloji",
    "kitaplar-ve-ogrenme",
    "fotograf",
  ] as const;
  const primaryWorkspaces = workspacePrimaryNavigationItems().filter((item) =>
    primaryWorkspaceKeys.some((key) => item.id === `workspace-${key}`),
  );

  return [
    internalLink("home", "Ana sayfa", "/"),
    ...primaryWorkspaces,
    {
      ...(about ?? internalLink("about", "Hakkımda", "/hakkimda")),
      href: "/hakkimda",
      activePathPrefix: "/hakkimda",
      children: aboutNavigationItems(),
    },
    {
      ...(contact ?? internalLink("contact", "İletişim", contactPaths.tr)),
      href: contactPaths.tr,
      activePathPrefix: contactPaths.tr,
      children: [],
    },
  ];
}

/**
 * The English header (NAV-EN-ANCHORS). Every in-page link targets a section
 * the English home page renders (`#istanbul` is the district atlas,
 * `#about` the about section); header-navigation.test.ts checks them
 * against the home page source. An area without English content (AI &
 * Technology) is left out instead of pointing at nothing, and no entry has
 * a one-link panel: a single child repeating its parent is a plain link.
 */
export function getEnglishHeaderNavigationItems(): PublicNavigationLink[] {
  return [
    internalLink("home", "Home", "/en"),
    englishHomeAnchorLink(
      "real-estate-istanbul",
      "Real Estate & Istanbul",
      "istanbul",
    ),
    internalLink(
      "research-analysis",
      "Research & Analysis",
      articleListPaths.en,
    ),
    internalLink("books-learning", "Books & Learning", bookListPaths.en),
    internalLink("photography", "Photography", photoListPaths.en),
    englishHomeAnchorLink("about", "About", "about"),
    internalLink("contact", "Contact", contactPaths.en),
  ];
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
      href:
        locale === "tr"
          ? "/calisma-alanlari"
          : `${anchorPrefix}#${anchors.work}`,
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

  return locale === "tr"
    ? withTurkishHeaderShortcuts(items)
    : getEnglishHeaderNavigationItems();
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

/**
 * Site search pages (SITE-SEARCH). route-parity.ts pairs them, so they are
 * served in both languages or in neither.
 */
export const searchPaths = {
  tr: "/ara",
  en: "/en/search",
} as const satisfies Record<Locale, string>;

/** RSS feeds of the publications (FEEDS), one per language. */
export const feedPaths = {
  tr: "/feed.xml",
  en: "/en/feed.xml",
} as const satisfies Record<Locale, string>;

const footerSitemapLabels = {
  tr: {
    workspaces: "Çalışma alanları",
    allWorkspaces: "Tüm çalışma alanları",
    explore: "Keşfet",
    districtGuide: "İstanbul İlçe Rehberi",
    articles: "Makaleler",
    books: "Kitaplar",
    photos: "Fotoğraflar",
    site: "Site",
    about: "Hakkımda",
    search: "Ara",
    feed: "RSS beslemesi",
    otherLanguage: "English",
  },
  en: {
    explore: "Explore",
    districtGuide: "Istanbul district atlas",
    articles: "Articles",
    books: "Books",
    photos: "Photography",
    site: "Site",
    about: "About",
    search: "Search",
    feed: "RSS feed",
    otherLanguage: "Türkçe",
  },
} as const;

function footerLink(
  id: string,
  label: string,
  href: string,
  lang?: Locale,
): PublicNavigationLink {
  return {
    id,
    label,
    href,
    external: false,
    newTab: false,
    ...(lang === undefined ? {} : { lang }),
    children: [],
  };
}

/**
 * The footer's site map (FOOTER-SITEMAP): the workspaces (Turkish only),
 * the publication lists and the district guide, then about, search, the RSS
 * feed and the other language. It is defined in code for both public
 * sources; the CMS or static footer links follow it, and
 * `withFooterSitemap` drops a site map link the CMS already offers.
 */
export function getFooterSitemapGroups(locale: Locale): PublicFooterGroup[] {
  const site = (labels: {
    about: string;
    search: string;
    feed: string;
    otherLanguage: string;
    site: string;
  }): PublicFooterGroup => {
    const other: Locale = locale === "tr" ? "en" : "tr";
    return {
      id: "footer-sitemap-site",
      title: labels.site,
      links: [
        footerLink(
          "footer-about",
          labels.about,
          locale === "tr" ? "/hakkimda" : "/en#about",
        ),
        footerLink("footer-search", labels.search, searchPaths[locale]),
        footerLink("footer-feed", labels.feed, feedPaths[locale]),
        footerLink(
          "footer-language",
          labels.otherLanguage,
          other === "tr" ? "/" : "/en",
          other,
        ),
      ],
    };
  };

  if (locale === "en") {
    const labels = footerSitemapLabels.en;
    return [
      {
        id: "footer-sitemap-explore",
        title: labels.explore,
        links: [
          footerLink("footer-articles", labels.articles, articleListPaths.en),
          footerLink("footer-books", labels.books, bookListPaths.en),
          footerLink("footer-photos", labels.photos, photoListPaths.en),
          footerLink(
            "footer-district-guide",
            labels.districtGuide,
            "/en#istanbul",
          ),
        ],
      },
      site(labels),
    ];
  }

  const labels = footerSitemapLabels.tr;
  return [
    {
      id: "footer-sitemap-workspaces",
      title: labels.workspaces,
      links: [
        ...workspaces.map((workspace) =>
          footerLink(
            `footer-workspace-${workspace.key}`,
            workspace.title,
            `/${workspace.key}`,
          ),
        ),
        footerLink("footer-workspaces", labels.allWorkspaces, workspacePath),
      ],
    },
    {
      id: "footer-sitemap-explore",
      title: labels.explore,
      links: [
        footerLink(
          "footer-district-guide",
          labels.districtGuide,
          districtGuidePath,
        ),
        footerLink("footer-articles", labels.articles, articleListPaths.tr),
        footerLink("footer-books", labels.books, bookListPaths.tr),
        footerLink("footer-photos", labels.photos, photoListPaths.tr),
      ],
    },
    site(labels),
  ];
}
