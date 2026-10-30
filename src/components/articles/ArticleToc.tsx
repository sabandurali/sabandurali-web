import { cx } from "@/components/ui/cx";
import type { OutlineHeading } from "./article-outline";

export const articleTocCopy = {
  tr: { title: "İçindekiler" },
  en: { title: "Contents" },
} as const;

/**
 * Table of contents of an article: its h2 and h3 headings as in-page
 * links, shown from three headings on (getTocEntries). Nothing renders
 * for an empty list. Left out of print: the links lead nowhere on paper.
 */
export default function ArticleToc({
  entries,
  locale,
  className,
}: {
  entries: readonly OutlineHeading[];
  locale: keyof typeof articleTocCopy;
  className?: string;
}) {
  if (entries.length === 0) return null;
  const copy = articleTocCopy[locale];

  return (
    <nav
      id="article-toc"
      aria-labelledby="article-toc-heading"
      className={cx(
        "rounded-card border border-ink bg-land p-5 sm:p-6 print:hidden",
        className,
      )}
    >
      <h2 id="article-toc-heading" className="m-0 type-h4">
        {copy.title}
      </h2>
      <ol className="mt-3 mb-0 grid list-none gap-0 p-0">
        {entries.map((entry) => (
          <li key={entry.id} className={entry.level === 3 ? "pl-5" : undefined}>
            <a
              href={`#${entry.id}`}
              className={cx(
                "inline-flex min-h-tap items-center underline decoration-1 underline-offset-[0.2em] hover:decoration-2",
                entry.level === 3 ? "type-small" : "type-body font-semibold",
              )}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
