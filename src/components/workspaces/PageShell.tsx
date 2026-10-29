import type { ReactNode } from "react";
import BackToTop from "@/components/layout/BackToTop";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { homeContent, type Locale } from "@/content/homeContent";

type PageShellProps = {
  locale: Locale;
  /** Language switcher targets: the page itself and its counterpart. */
  languageHrefs: Record<Locale, string>;
  /** The page's <main id="main"> and its content. */
  children: ReactNode;
};

/**
 * Header, footer and back-to-top link around every page except the home
 * page (its header links to its own sections and reads the CMS content) and
 * the 404 screen: contact, privacy, about, workspace, publication and
 * district pages. They all pass through here, so the site shell is wired in
 * one place (shell.test.ts keeps it so). The page renders its own
 * `<main id="main">` (the root layout's SkipLink targets it).
 */
export default function PageShell({
  locale,
  languageHrefs,
  children,
}: PageShellProps) {
  const home = homeContent[locale];
  const homePath = locale === "tr" ? "/" : "/en";

  return (
    <div id="top" lang={locale}>
      <Header
        locale={locale}
        anchors={home.anchors}
        content={home.header}
        anchorPrefix={homePath}
        languageHrefs={languageHrefs}
      />
      {children}
      <Footer id={home.anchors.contact} content={home.footer} />
      <BackToTop label={home.backToTopLabel} />
    </div>
  );
}
