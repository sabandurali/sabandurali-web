import type { Metadata } from "next";
import ContactPage from "@/components/ContactPage";
import { contactPaths } from "@/config/site";
import { contactContent } from "@/content/contactContent";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "İletişim | Şaban Durali",
  description:
    "Şaban Durali ile iş birliği, danışmanlık, araştırma ve platform konularında iletişime geçin.",
  locale: "tr",
  path: contactPaths.tr,
  translations: contactPaths,
});

export default function TurkishContactPage() {
  return <ContactPage content={contactContent.tr} />;
}
