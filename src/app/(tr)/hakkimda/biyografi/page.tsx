import type { Metadata } from "next";
import BackToTop from "@/components/layout/BackToTop";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { getAbsoluteUrl } from "@/config/site";
import { homeContent } from "@/content/homeContent";

export const metadata: Metadata = {
  title: "Biyografi | Şaban Durali",
  description: "Şaban Durali biyografi bilgileri için hazırlanan sayfa.",
  alternates: { canonical: getAbsoluteUrl("/hakkimda/biyografi") },
};

export default function BiographyPage() {
  const home = homeContent.tr;

  return (
    <div id="top" lang="tr">
      <Header locale="tr" anchors={home.anchors} content={home.header} homeHref="/" anchorPrefix="/" languageHrefs={{ tr: "/hakkimda/biyografi", en: "/en" }} />
      <main className="bg-ivory text-ink">
        <section className="mx-auto max-w-4xl px-6 py-16 sm:py-24 lg:px-10 lg:py-32">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent">Hakkımda</p>
          <h1 className="mt-6 font-serif text-5xl font-semibold leading-none sm:text-6xl">Biyografi</h1>
          <div className="mt-10 max-w-2xl border-l-2 border-accent/40 pl-5 text-lg leading-8 text-muted-dark">
            <p>Şaban Durali&apos;nin doğrulanmış biyografi bilgileri bu alanda yayınlanmak üzere hazırlanmaktadır.</p>
          </div>
        </section>
      </main>
      <Footer id={home.anchors.contact} content={home.footer} />
      <BackToTop label={home.backToTopLabel} />
    </div>
  );
}
