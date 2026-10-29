import type { Metadata } from "next";
import PrivacyNoticePage from "@/components/PrivacyNoticePage";
import { privacyPaths } from "@/config/site";
import { privacyContent } from "@/content/privacyContent";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "KVKK Aydınlatma Metni | Şaban Durali",
  description:
    "Şaban Durali iletişim formunda kişisel verilerin işlenmesine ilişkin aydınlatma metni.",
  locale: "tr",
  path: privacyPaths.tr,
  translations: privacyPaths,
});

export default function TurkishPrivacyNoticePage() {
  return <PrivacyNoticePage content={privacyContent.tr} />;
}
