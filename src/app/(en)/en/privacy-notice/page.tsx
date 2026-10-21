import type { Metadata } from "next";
import PrivacyNoticePage from "@/components/PrivacyNoticePage";
import { privacyUrls } from "@/config/site";
import { privacyContent } from "@/content/privacyContent";

export const metadata: Metadata = {
  title: "Privacy Notice | Şaban Durali",
  description:
    "Privacy notice on the processing of personal data through the Şaban Durali contact form under Türkiye’s Law No. 6698.",
  alternates: {
    canonical: privacyUrls.en,
    languages: privacyUrls,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function EnglishPrivacyNoticePage() {
  return <PrivacyNoticePage content={privacyContent.en} />;
}
