import type { Metadata } from "next";
import ContactPage from "@/components/ContactPage";
import { contactUrls } from "@/config/site";
import { contactContent } from "@/content/contactContent";

export const metadata: Metadata = {
  title: "İletişim | Şaban Durali",
  description:
    "Şaban Durali ile iş birliği, danışmanlık, araştırma ve platform konularında iletişime geçin.",
  alternates: {
    canonical: contactUrls.tr,
    languages: contactUrls,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TurkishContactPage() {
  return <ContactPage content={contactContent.tr} />;
}
