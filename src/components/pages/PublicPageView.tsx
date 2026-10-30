import PageBlocks, { opensWithHero } from "@/components/pages/PageBlocks";
import PageIntro from "@/components/ui/PageIntro";
import PublicationShell from "@/components/pages/PublicationShell";
import { publicationCopy } from "@/components/pages/publication-copy";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Container from "@/components/ui/Container";
import type { PublicPage } from "@/content/pages/public-types";

/**
 * A Turkish standard page from the CMS. Standard pages exist only in
 * Turkish (English ones stay drafts), so the language switcher leads to the
 * English home page. When the page opens with a hero block, the hero
 * carries the h1; otherwise the page title and summary open the page.
 */
export default function PublicPageView({ page }: { page: PublicPage }) {
  const locale = page.language;
  const copy = publicationCopy[locale];
  const breadcrumb = [
    { label: copy.home, href: copy.homePath },
    { label: page.title },
  ];
  // Only Turkish standard pages have a public route (/[slug]).
  const languageHrefs = { tr: `/${page.slug}`, en: "/en" };

  return (
    <PublicationShell locale={locale} languageHrefs={languageHrefs}>
      {opensWithHero(page.layout) ? (
        <Container className="pt-6">
          <Breadcrumb items={breadcrumb} locale={locale} />
        </Container>
      ) : (
        <PageIntro
          layout="page"
          locale={locale}
          breadcrumb={breadcrumb}
          title={page.title}
          lead={page.summary}
        />
      )}
      <PageBlocks blocks={page.layout} locale={locale} />
    </PublicationShell>
  );
}
