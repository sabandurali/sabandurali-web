import type { Metadata } from "next";
import PrivacyNoticePage from "@/components/PrivacyNoticePage";
import { privacyPaths } from "@/config/site";
import { privacyContent } from "@/content/privacyContent";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Notice | Şaban Durali",
  description:
    "Privacy notice on the processing of personal data through the Şaban Durali contact form under Türkiye’s Law No. 6698.",
  locale: "en",
  path: privacyPaths.en,
  translations: privacyPaths,
});

export default function EnglishPrivacyNoticePage() {
  return <PrivacyNoticePage content={privacyContent.en} />;
}
