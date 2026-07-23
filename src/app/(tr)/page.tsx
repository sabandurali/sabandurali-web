import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomePage from "@/components/HomePage";
import PublicPageView from "@/components/pages/PublicPageView";
import { homeUrls } from "@/config/site";
import { homeContent } from "@/content/homeContent";
import { getTurkishHomePageData } from "@/content/pages/page-data-source";
import { createPublicPageMetadata } from "@/content/pages/page-seo";

const staticMetadata: Metadata = {
  title: "Şaban Durali | Araştırma ve Bilgi Platformu",
  description:
    "Gayrimenkul, danışmanlık, araştırma ve teknoloji alanlarında güvenilir bilgi, uygulanabilir analiz ve sürdürülebilir değer üreten bağımsız platform.",
  alternates: {
    canonical: homeUrls["tr-TR"],
    languages: homeUrls,
  },
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

  return data.page === null
    ? {
        title: "Ana sayfa bulunamadı | Şaban Durali",
        robots: { index: false, follow: false },
      }
    : createPublicPageMetadata(data.page);
}

export default async function Home() {
  const data = await getTurkishHomePageData();

  if (data.source === "static") {
    return <HomePage content={homeContent.tr} />;
  }

  if (data.page === null) notFound();

  return <PublicPageView page={data.page} />;
}
