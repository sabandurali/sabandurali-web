import type { Metadata } from "next";
import { notFound } from "next/navigation";

/** The (en) not-found file cannot set metadata; the 404 title lives here. */
export const metadata: Metadata = {
  title: "Page not found | Şaban Durali",
  description: "The requested page was not found.",
};

/**
 * CRT-5: an unmatched /en/* address gets the English 404 of the (en) root
 * layout (lang="en", English header and footer) instead of the bilingual
 * global 404. More specific /en routes always win over this catch-all.
 */
export default function EnglishMissingPage(): never {
  notFound();
}
