import type { Metadata } from "next";
import ContactPage from "@/components/ContactPage";
import { contactUrls } from "@/config/site";
import { contactContent } from "@/content/contactContent";

export const metadata: Metadata = {
  title: "Contact | Şaban Durali",
  description:
    "Contact Şaban Durali about collaboration, consulting, research and the platform.",
  alternates: {
    canonical: contactUrls.en,
    languages: contactUrls,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function EnglishContactPage() {
  return <ContactPage content={contactContent.en} />;
}
