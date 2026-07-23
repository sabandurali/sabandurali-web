export type PublicNavigationLink = {
  id: string;
  label: string;
  href: string | null;
  external: boolean;
  newTab: boolean;
  activePathPrefix?: string;
  mobileOnly?: boolean;
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
