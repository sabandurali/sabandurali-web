import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomePage from "@/components/HomePage";
import { homeUrls } from "@/config/site";
import { homeContent } from "@/content/homeContent";
import { getPayloadHomeContent } from "@/content/pages/home-page-content";
import { getTurkishHomePageData } from "@/content/pages/page-data-source";
import { createPublicPageMetadata } from "@/content/pages/page-seo";

const homeAlternates: NonNullable<Metadata["alternates"]> = {
  canonical: homeUrls["tr-TR"],
  languages: homeUrls,
};

const staticMetadata: Metadata = {
  title: "Şaban Durali | Araştırma ve Bilgi Platformu",
  description:
    "Gayrimenkul, danışmanlık, araştırma ve teknoloji alanlarında güvenilir bilgi, uygulanabilir analiz ve sürdürülebilir değer üreten bağımsız platform.",
  alternates: homeAlternates,
  openGraph: {
    title: "Şaban Durali | Araştırma ve Bilgi Platformu",
    description:
      "Gayrimenkul, danışmanlık, araştırma ve teknoloji alanlarında güvenilir bilgi, uygulanabilir analiz ve sürdürülebilir değer üreten bağımsız platform.",
    url: homeUrls["tr-TR"],
    locale: "tr_TR",
    alternateLocale: "en_US",
    type: "website",
    siteName: "Şaban Durali",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const data = await getTurkishHomePageData();

  if (data.source === "static") return staticMetadata;

  const metadata = data.page === null
    ? {
        title: "Ana sayfa bulunamadı | Şaban Durali",
        robots: { index: false, follow: false },
      }
    : createPublicPageMetadata(data.page);

  return {
    ...metadata,
    alternates: homeAlternates,
  };
}

export default async function Home() {
  const data = await getTurkishHomePageData();

  if (data.source === "static") {
    return <HomePage content={homeContent.tr} />;
  }

  if (data.page === null) notFound();

  const content = getPayloadHomeContent(data.page, homeContent.tr);

  if (content === null) notFound();

  return <HomePage content={content} />;
}
