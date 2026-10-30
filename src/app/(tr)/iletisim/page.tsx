import type { Metadata } from "next";
import ContactPage from "@/components/ContactPage";
import { contactPaths } from "@/config/site";
import { contactContent } from "@/content/contactContent";
import { createContactPageJsonLd, serializeJsonLd } from "@/content/entity-seo";
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
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(createContactPageJsonLd("tr")),
        }}
      />
      <ContactPage content={contactContent.tr} />
    </>
  );
}
