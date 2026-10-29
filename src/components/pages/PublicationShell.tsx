import type { ReactNode } from "react";
import BackToTop from "@/components/layout/BackToTop";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { homeContent, type Locale } from "@/content/homeContent";

type PublicationShellProps = {
  locale: Locale;
  /** Language switcher targets: the translation, or the other list page. */
  languageHrefs?: Record<Locale, string>;
  children: ReactNode;
};

/**
 * Page frame of the publication pages (articles, books, photos, standard
 * pages): site header, `<main id="main">` for the skip link, footer.
 *
 * The wrapper sets the atlas ground and ink colour itself, so the pages read
 * correctly whatever ground the root layout still sets.
 */
export default function PublicationShell({
  locale,
  languageHrefs,
  children,
}: PublicationShellProps) {
  const home = homeContent[locale];
  const homePath = locale === "tr" ? "/" : "/en";

  return (
    <div id="top" lang={locale} className="bg-paper text-ink scheme-light">
      <Header
        locale={locale}
        anchors={home.anchors}
        content={home.header}
        homeHref={homePath}
        anchorPrefix={homePath}
        languageHrefs={languageHrefs}
      />
      <main id="main">{children}</main>
      <Footer id={home.anchors.contact} content={home.footer} />
      <BackToTop label={home.backToTopLabel} />
    </div>
  );
}
