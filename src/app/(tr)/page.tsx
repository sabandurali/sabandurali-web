import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import { homeUrls, siteSocialImage } from "@/config/site";
import { getHomeContent } from "@/content/pages/page-data-source";
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
    images: [siteSocialImage],
  },
  twitter: {
    card: "summary_large_image",
    images: [siteSocialImage],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  // A missing or incomplete CMS home page falls back to the static content.
  const { page } = await getHomeContent("tr");

  if (page === null) return staticMetadata;

  return {
    ...createPublicPageMetadata(page),
    alternates: homeAlternates,
  };
}

export default async function Home() {
  const { content } = await getHomeContent("tr");

  return <HomePage content={content} />;
}
