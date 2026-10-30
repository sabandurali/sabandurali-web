import type { ReactNode } from "react";
import { cx } from "./cx";
import { getUiStrings, type UiLocale } from "./strings";

export type CreditInfo = {
  /** Photographer or author; shown as "Fotoğraf: <author>". */
  author?: string;
  /** Archive or collection, shown without a prefix. */
  collection?: string;
  /** Display date, already formatted (e.g. "23.09.2021", "1904"). */
  date?: string;
  /** Licence name as the source states it, e.g. "CC BY-SA 4.0", "Kamu malı". */
  licence?: string;
  licenceUrl?: string;
  /** Page of the original (archive record, Commons file page). */
  sourceUrl?: string;
  /** Link text for `sourceUrl`; defaults to "Kaynak". */
  sourceLabel?: string;
};

type CreditProps = {
  credit: CreditInfo;
  tone?: "ink" | "on-sea";
  locale?: UiLocale;
  className?: string;
};

const linkClassName =
  "relative z-10 underline decoration-1 underline-offset-[0.2em] hover:decoration-2";

/**
 * Image credit: author or collection · date · licence · source, separated by
 * middots. Links sit above a card's expanded hit area (z-10).
 */
export function Credit({
  credit,
  tone = "ink",
  locale = "tr",
  className,
}: CreditProps) {
  const strings = getUiStrings(locale);
  const parts: ReactNode[] = [];

  if (credit.author) parts.push(`${strings.photo}: ${credit.author}`);
  if (credit.collection) parts.push(credit.collection);
  if (credit.date) parts.push(credit.date);
  if (credit.licence) {
    parts.push(
      credit.licenceUrl ? (
        <a
          href={credit.licenceUrl}
          rel="license noopener noreferrer"
          className={linkClassName}
        >
          {credit.licence}
        </a>
      ) : (
        credit.licence
      ),
    );
  }
  if (credit.sourceUrl) {
    parts.push(
      <a
        href={credit.sourceUrl}
        rel="noopener noreferrer"
        className={linkClassName}
      >
        {credit.sourceLabel ?? strings.originalSource}
        {/* External record: a visual cue only, the link text names it. */}
        <span aria-hidden="true"> ↗</span>
      </a>,
    );
  }

  if (parts.length === 0) return null;

  return (
    <span
      className={cx(
        "type-caption",
        tone === "on-sea" ? "text-on-sea-muted" : "text-ink-muted",
        className,
      )}
    >
      {parts.map((part, index) => (
        <span key={index}>
          {index > 0 ? <span aria-hidden="true"> · </span> : null}
          {part}
        </span>
      ))}
    </span>
  );
}

type FigureProps = {
  /** The media: a next/image <Image>, an <svg>, a map. */
  children: ReactNode;
  caption?: ReactNode;
  /**
   * Required on purpose: pass the credit, or `null` for images that need
   * none (own photos, drawings). Never drop a credit the source requires.
   */
  credit: CreditInfo | null;
  tone?: "ink" | "on-sea";
  locale?: UiLocale;
  className?: string;
};

export function Figure({
  children,
  caption,
  credit,
  tone = "ink",
  locale = "tr",
  className,
}: FigureProps) {
  const hasCaption = caption !== undefined && caption !== null;

  return (
    <figure className={cx("m-0", className)}>
      {children}
      {hasCaption || credit ? (
        <figcaption
          className={cx(
            "flex flex-wrap justify-between gap-x-6 gap-y-1 pt-2.5 type-caption",
            tone === "on-sea" ? "text-on-sea-muted" : "text-ink-muted",
          )}
        >
          {hasCaption ? <span>{caption}</span> : null}
          {credit ? (
            <Credit credit={credit} tone={tone} locale={locale} />
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
