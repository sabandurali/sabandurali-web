import type { Metadata } from "next";
import EmptyState from "@/components/ui/EmptyState";
import Section from "@/components/ui/Section";
import TextLink from "@/components/ui/TextLink";
import PageIntro from "@/components/workspaces/PageIntro";
import PageShell from "@/components/workspaces/PageShell";
import { createPageMetadata } from "@/lib/metadata";

const path = "/hakkimda/biyografi";

/* FE-10: no verified biography text exists yet. The page stays reachable
   for old links but is kept out of search results (noindex, follow) and
   says plainly that the text has not been added. */
export const metadata: Metadata = createPageMetadata({
  title: "Biyografi | Şaban Durali",
  description:
    "Şaban Durali'nin doğrulanmış biyografi metni henüz yayınlanmadı; profil özeti Hakkımda sayfasındadır.",
  locale: "tr",
  path,
  index: false,
  follow: true,
});

export default function BiographyPage() {
  return (
    <PageShell locale="tr" languageHrefs={{ tr: path, en: "/en" }}>
      <main id="main" className="bg-paper text-ink">
        <Section>
          <PageIntro
            breadcrumb={[
              { label: "Ana sayfa", href: "/" },
              { label: "Hakkımda", href: "/hakkimda" },
              { label: "Biyografi" },
            ]}
            eyebrow="Hakkımda"
            title="Biyografi"
          />
          <EmptyState
            size="lg"
            className="mt-10"
            note={
              <>
                Mesleki deneyim ve eğitim özeti{" "}
                <TextLink href="/hakkimda#biyografi">Hakkımda</TextLink>{" "}
                sayfasında yer alır.
              </>
            }
          >
            Doğrulanmış biyografi metni henüz eklenmedi.
          </EmptyState>
        </Section>
      </main>
    </PageShell>
  );
}
