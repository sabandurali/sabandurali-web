import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import { homeContent } from "@/content/homeContent";

export const metadata: Metadata = {
  title: "Şaban Durali | Research and Knowledge Platform",
  description:
    "An independent platform producing reliable knowledge, actionable analysis and sustainable value across real estate, consulting, research and technology.",
};

export default function EnglishHome() {
  return <HomePage content={homeContent.en} />;
}
