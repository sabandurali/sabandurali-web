import type { SiteLocale } from "@/content/locales";

export type PublicNavigationLink = {
  id: string;
  label: string;
  href: string | null;
  external: boolean;
  newTab: boolean;
  activePathPrefix?: string;
  mobileOnly?: boolean;
  /** Language of the label and the target when it differs from the page's. */
  lang?: SiteLocale;
  children: PublicNavigationLink[];
};

export type PublicFooterGroup = {
  id: string;
  title: string | null;
  links: PublicNavigationLink[];
};

export type PublicNavigation = {
  headerItems: PublicNavigationLink[];
  footerGroups: PublicFooterGroup[];
};
