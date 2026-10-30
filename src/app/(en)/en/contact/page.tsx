import type { Metadata } from "next";
import ContactPage from "@/components/ContactPage";
import { contactPaths } from "@/config/site";
import { contactContent } from "@/content/contactContent";
import { createContactPageJsonLd, serializeJsonLd } from "@/content/entity-seo";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Contact | Şaban Durali",
  description:
    "Contact Şaban Durali about collaboration, consulting, research and the platform.",
  locale: "en",
  path: contactPaths.en,
  translations: contactPaths,
});

export default function EnglishContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(createContactPageJsonLd("en")),
        }}
      />
      <ContactPage content={contactContent.en} />
    </>
  );
}
