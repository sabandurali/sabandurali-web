import type { Metadata } from "next";
import PrivacyNoticePage from "@/components/PrivacyNoticePage";
import { privacyUrls } from "@/config/site";
import { privacyContent } from "@/content/privacyContent";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni | Şaban Durali",
  description:
    "Şaban Durali iletişim ve beta geri bildirim formlarında kişisel verilerin işlenmesine ilişkin aydınlatma metni.",
  alternates: {
    canonical: privacyUrls.tr,
    languages: privacyUrls,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TurkishPrivacyNoticePage() {
  return <PrivacyNoticePage content={privacyContent.tr} />;
}
