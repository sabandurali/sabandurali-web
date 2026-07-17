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
};

export default function EnglishHome() {
  return <HomePage content={homeContent.en} />;
}
