import type { Metadata } from "next";
import DistrictDirectory from "@/components/districts/DistrictDirectory";
import { getDistrictGuide } from "@/content/districts/district-guide-data-source";
import BackToTop from "@/components/layout/BackToTop";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { getAbsoluteUrl } from "@/config/site";
import {
  districts,
  getDistrictsBySide,
} from "@/content/districts/district-registry";
import { districtGuidePath } from "@/content/districts/district-routes";
import { homeContent } from "@/content/homeContent";

// Re-evaluate source expiry and CMS publication state on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "İstanbul İlçe Rehberi | Şaban Durali",
  openGraph: {
    title: "İstanbul İlçe Rehberi | Şaban Durali",
    description: "İstanbul’un 39 ilçesi için kaynak temelli ilçe rehberleri.",
    url: getAbsoluteUrl(districtGuidePath),
    locale: "tr_TR",
    type: "website",
  },
  description: "İstanbul’un 39 ilçesi için kaynak temelli ilçe rehberleri.",
  alternates: {
    canonical: getAbsoluteUrl(districtGuidePath),
    languages: { "tr-TR": getAbsoluteUrl(districtGuidePath) },
  },
};

export default async function DistrictIndexPage() {
  const entries = await Promise.all(
    districts.map(async ({ name, slug, side }) => ({
      name,
      slug,
      side,
      summary: (await getDistrictGuide(slug))?.summary ?? null,
    })),
  );
  const home = homeContent.tr;
  const european = getDistrictsBySide("avrupa");
  const asian = getDistrictsBySide("anadolu");
  return (
    <div id="top" lang="tr">
      <Header
        locale="tr"
        anchors={home.anchors}
        content={home.header}
        homeHref="/"
        anchorPrefix="/"
        languageHrefs={{ tr: districtGuidePath, en: "/en" }}
      />
      <main className="bg-[#10263A] px-4 py-10 sm:px-6 sm:py-14 lg:py-18">
        <div className="mx-auto max-w-[1440px]">
          <header className="border-b border-border pb-8 sm:pb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-strong">
              İstanbul
            </p>
            <h1 className="mt-3 text-4xl leading-[1.04] text-ivory sm:text-6xl">
              İstanbul İlçe Rehberi
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
              39 ilçeyi, doğrulanmış içerik ve kaynaklarla takip etmek için sade
              bir başlangıç noktası.
            </p>
            <dl className="mt-7 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
              <div className="bg-[#17364D] p-4 sm:p-5">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-strong">
                  Toplam
                </dt>
                <dd className="mt-2 text-3xl text-ivory">39 ilçe</dd>
              </div>
              <div className="bg-[#17364D] p-4 sm:p-5">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-strong">
                  Avrupa Yakası
                </dt>
                <dd className="mt-2 text-3xl text-ivory">
                  {european.length} ilçe
                </dd>
              </div>
              <div className="bg-[#17364D] p-4 sm:p-5">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-strong">
                  Anadolu Yakası
                </dt>
                <dd className="mt-2 text-3xl text-ivory">
                  {asian.length} ilçe
                </dd>
              </div>
            </dl>
          </header>
          <DistrictDirectory entries={entries} />
        </div>
      </main>
      <Footer id={home.anchors.contact} content={home.footer} />
      <BackToTop label={home.backToTopLabel} />
    </div>
  );
}
