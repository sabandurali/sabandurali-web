import type { Metadata } from "next";
import EmptyState from "@/components/ui/EmptyState";
import Section from "@/components/ui/Section";
import TextLink from "@/components/ui/TextLink";
import PageIntro from "@/components/ui/PageIntro";
import PageShell from "@/components/workspaces/PageShell";
import { createPageMetadata } from "@/lib/metadata";
import { homeBreadcrumbItem } from "@/components/ui/Breadcrumb";

const path = "/hakkimda/egitim-sertifikalar-diplomalar";

/* FE-10: no certificate or diploma has been published. The page stays
   reachable but is noindex, follow and shows an explicit empty state for
   each part instead of placeholder text. */
export const metadata: Metadata = createPageMetadata({
  title: "Eğitim, Sertifikalar & Diplomalar | Şaban Durali",
  description:
    "Şaban Durali’nin sertifika ve diploma belgeleri henüz yayımlanmadı; eğitim özeti Hakkımda sayfasındadır.",
  locale: "tr",
  path,
  index: false,
  follow: true,
});

const parts = [
  { id: "egitim", title: "Eğitim", empty: "Eğitim belgeleri henüz eklenmedi." },
  {
    id: "sertifikalar",
    title: "Sertifikalar",
    empty: "Sertifika bilgileri henüz eklenmedi.",
  },
  {
    id: "diplomalar",
    title: "Diplomalar",
    empty: "Diploma bilgileri henüz eklenmedi.",
  },
] as const;

export default function EducationCertificatesDiplomasPage() {
  return (
    <PageShell locale="tr" languageHrefs={{ tr: path, en: "/en" }}>
      <main id="main" className="scheme-light bg-paper text-ink">
        <Section>
          <PageIntro
            breadcrumb={[
              homeBreadcrumbItem("tr"),
              { label: "Hakkımda", href: "/hakkimda" },
              { label: "Eğitim, Sertifikalar & Diplomalar" },
            ]}
            eyebrow="Hakkımda"
            title="Eğitim, Sertifikalar & Diplomalar"
            lead={
              <>
                Özgeçmiş beyanına dayanan eğitim özeti{" "}
                <TextLink href="/hakkimda#egitim-sertifikalar">
                  Hakkımda
                </TextLink>{" "}
                sayfasındadır.
              </>
            }
          />
          <div className="mt-12 flex flex-col gap-10">
            {parts.map((part) => (
              <section
                key={part.id}
                id={part.id}
                aria-labelledby={`${part.id}-title`}
                className="flex flex-col gap-4 border-t border-hairline pt-8"
              >
                <h2 id={`${part.id}-title`} className="m-0 type-h3">
                  {part.title}
                </h2>
                <EmptyState>{part.empty}</EmptyState>
              </section>
            ))}
          </div>
        </Section>
      </main>
    </PageShell>
  );
}
