import type { Metadata } from "next";
import BackToTop from "@/components/layout/BackToTop";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { getAbsoluteUrl } from "@/config/site";
import { homeContent } from "@/content/homeContent";

const sections = [
  ["Eğitim", "Doğrulanmış eğitim geçmişi bu alanda yayınlanmak üzere hazırlanmaktadır."],
  ["Sertifikalar", "Mesleki eğitim ve sertifika bilgileri bu alanda yayınlanmak üzere hazırlanmaktadır."],
  ["Diplomalar", "Resmî diploma ve mezuniyet bilgileri bu alanda yayınlanmak üzere hazırlanmaktadır."],
] as const;

export const metadata: Metadata = {
  title: "Eğitim, Sertifikalar & Diplomalar | Şaban Durali",
  description: "Şaban Durali eğitim, sertifika ve diploma bilgileri için hazırlanan sayfa.",
  alternates: { canonical: getAbsoluteUrl("/hakkimda/egitim-sertifikalar-diplomalar") },
};

export default function EducationCertificatesDiplomasPage() {
  const home = homeContent.tr;

  return (
    <div id="top" lang="tr">
      <Header locale="tr" anchors={home.anchors} content={home.header} homeHref="/" anchorPrefix="/" languageHrefs={{ tr: "/hakkimda/egitim-sertifikalar-diplomalar", en: "/en" }} />
      <main className="bg-ivory text-ink">
        <section className="mx-auto max-w-4xl px-6 py-16 sm:py-24 lg:px-10 lg:py-32">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent">Hakkımda</p>
          <h1 className="mt-6 font-serif text-5xl font-semibold leading-none sm:text-6xl">Eğitim, Sertifikalar &amp; Diplomalar</h1>
          <div className="mt-12 divide-y divide-border">
            {sections.map(([title, description]) => (
              <section key={title} className="py-7 first:pt-0">
                <h2 className="font-serif text-2xl font-semibold">{title}</h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-muted-dark">{description}</p>
              </section>
            ))}
          </div>
        </section>
      </main>
      <Footer id={home.anchors.contact} content={home.footer} />
      <BackToTop label={home.backToTopLabel} />
    </div>
  );
}
