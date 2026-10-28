import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import { homeUrls, siteSocialImage } from "@/config/site";
import { getHomeContent } from "@/content/pages/page-data-source";
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
    images: [siteSocialImage],
  },
  twitter: {
    card: "summary_large_image",
    images: [siteSocialImage],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  // A missing or incomplete CMS home page falls back to the static content.
  const { page } = await getHomeContent("en");

  if (page === null) return staticMetadata;

  return {
    ...createPublicPageMetadata(page),
    alternates: homeAlternates,
  };
}

export default async function EnglishHome() {
  const { content } = await getHomeContent("en");

  return <HomePage content={content} />;
}
