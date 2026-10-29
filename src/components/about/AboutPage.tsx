import PageShell from "@/components/workspaces/PageShell";
import AboutPageContent, { type AboutPageProps } from "./AboutPageContent";

/** The /hakkimda page: the site shell around AboutPageContent. */
export default function AboutPage(props: AboutPageProps) {
  return (
    <PageShell locale="tr" languageHrefs={{ tr: "/hakkimda", en: "/en" }}>
      <main id="main" className="scheme-light bg-paper text-ink">
        <AboutPageContent {...props} />
      </main>
    </PageShell>
  );
}
