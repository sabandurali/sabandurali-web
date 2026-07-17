import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import { homeUrls } from "@/config/site";
import { homeContent } from "@/content/homeContent";

export const metadata: Metadata = {
  title: "Şaban Durali | Research and Knowledge Platform",
  description:
    "An independent platform producing reliable knowledge, actionable analysis and sustainable value across real estate, consulting, research and technology.",
  alternates: {
    canonical: homeUrls.en,
    languages: homeUrls,
  },
  openGraph: {
    title: "Şaban Durali | Research and Knowledge Platform",
    description:
      "An independent platform producing reliable knowledge, actionable analysis and sustainable value across real estate, consulting, research and technology.",
    url: homeUrls.en,
    locale: "en_US",
    alternateLocale: "tr_TR",
    type: "website",
    siteName: "Şaban Durali",
  },
};

export default function EnglishHome() {
  return <HomePage content={homeContent.en} />;
}
