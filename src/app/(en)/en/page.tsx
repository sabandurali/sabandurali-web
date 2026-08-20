import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import { homeUrls } from "@/config/site";
import { homeContent } from "@/content/homeContent";
import { getPayloadHomeContent } from "@/content/pages/home-page-content";
import { getEnglishHomePageData } from "@/content/pages/page-data-source";
import { createPublicPageMetadata } from "@/content/pages/page-seo";

const homeAlternates: NonNullable<Metadata["alternates"]> = {
  canonical: homeUrls.en,
  languages: homeUrls,
};

const staticMetadata: Metadata = {
  title: "Şaban Durali | Research and Knowledge Platform",
  description:
    "An independent platform producing reliable knowledge, actionable analysis and sustainable value across real estate, consulting, research and technology.",
  alternates: homeAlternates,
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

export async function generateMetadata(): Promise<Metadata> {
  const data = await getEnglishHomePageData();

  if (
    data.source === "static" ||
    data.page === null ||
    getPayloadHomeContent(data.page, homeContent.en) === null
  ) {
    return staticMetadata;
  }

  return {
    ...createPublicPageMetadata(data.page),
    alternates: homeAlternates,
  };
}

export default async function EnglishHome() {
  const data = await getEnglishHomePageData();

  if (data.source === "payload" && data.page !== null) {
    const content = getPayloadHomeContent(data.page, homeContent.en);

    if (content !== null) return <HomePage content={content} />;
  }

  return <HomePage content={homeContent.en} />;
}
