import type { ReactNode } from "react";
import PageShell from "@/components/workspaces/PageShell";
import type { Locale } from "@/content/homeContent";

type PublicationShellProps = {
  locale: Locale;
  /** Language switcher targets: the translation, or the other list page. */
  languageHrefs: Record<Locale, string>;
  children: ReactNode;
};

/**
 * Page frame of the publication pages (articles, books, photos, standard
 * pages): the shared site shell (header, footer, back-to-top) around
 * `<main id="main">`, the target of the root layout's skip link. The main
 * element sets the atlas ground itself, like every other rebuilt page.
 */
export default function PublicationShell({
  locale,
  languageHrefs,
  children,
}: PublicationShellProps) {
  return (
    <PageShell locale={locale} languageHrefs={languageHrefs}>
      <main id="main" className="bg-paper text-ink scheme-light">
        {children}
      </main>
    </PageShell>
  );
}
