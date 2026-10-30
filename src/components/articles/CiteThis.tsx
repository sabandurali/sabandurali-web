import { cx } from "@/components/ui/cx";
import { ChevronDownIcon } from "@/components/ui/icons";
import type { SiteLocale } from "@/content/locales";
import { apaCitation, bibtexCitation, type CitationInput } from "./citation";

export const citeThisCopy = {
  tr: {
    summary: "Nasıl atıf yapılır",
    apa: "APA 7",
    bibtex: "BibTeX",
  },
  en: {
    summary: "How to cite",
    apa: "APA 7",
    bibtex: "BibTeX",
  },
} as const satisfies Record<
  SiteLocale,
  { summary: string; apa: string; bibtex: string }
>;

/**
 * "How to cite" disclosure: the APA 7 reference and a BibTeX entry of the
 * page, built from its published title, author, canonical URL and dates
 * (citation.ts). A native <details>, so it works without JavaScript; the
 * print styles print it open. The texts wrap inside the reading column,
 * so they never scroll the page sideways.
 */
export default function CiteThis({
  citation,
  className,
}: {
  citation: CitationInput;
  className?: string;
}) {
  const copy = citeThisCopy[citation.language];
  const formats = [
    { label: copy.apa, value: apaCitation(citation), id: "apa" },
    { label: copy.bibtex, value: bibtexCitation(citation), id: "bibtex" },
  ];

  return (
    <details
      className={cx("group rounded-card border border-ink bg-land", className)}
    >
      <summary className="flex min-h-tap cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 type-h4 [&::-webkit-details-marker]:hidden">
        <span>{copy.summary}</span>
        <ChevronDownIcon
          size={20}
          className="shrink-0 transition-transform duration-150 ease-atlas group-open:rotate-180"
        />
      </summary>
      <div className="grid gap-5 border-t border-hairline px-5 py-4">
        {formats.map((format) => (
          <figure key={format.id} className="m-0 grid min-w-0 gap-2">
            <figcaption className="type-label text-ink-muted">
              {format.label}
            </figcaption>
            {/* overflow-wrap:anywhere also lowers the min-content width, so
                a long URL wraps instead of widening the grid column. */}
            <pre className="m-0 min-w-0 rounded-tile border border-hairline bg-paper p-3 type-data-md whitespace-pre-wrap [overflow-wrap:anywhere]">
              {format.value}
            </pre>
          </figure>
        ))}
      </div>
    </details>
  );
}
