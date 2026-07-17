import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import { homeUrls } from "@/config/site";
import { homeContent } from "@/content/homeContent";

export const metadata: Metadata = {
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

export default function Home() {
  return <HomePage content={homeContent.tr} />;
}
