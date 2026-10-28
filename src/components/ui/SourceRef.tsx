import { cx } from "./cx";
import { getUiStrings, type UiLocale } from "./strings";
import VisuallyHidden from "./VisuallyHidden";

/**
 * Source references are bracketed numbers, "[3]": a citation form that
 * cannot be read as a map square ("F2") or a neighbourhood number ("03").
 */
export function formatSourceCode(number: number): string {
  return `[${number}]`;
}

/** Stable anchor id of a row in the sources table. */
export function sourceAnchorId(number: number): string {
  return `kaynak-${number}`;
}

type SourceRefProps = {
  number: number;
  /** Defaults to the row of the sources table on the same page. */
  href?: string;
  locale?: UiLocale;
  className?: string;
};

/** Link to a numbered source; 44 × 44 px touch target around "[3]". */
export function SourceRef({
  number,
  href = `#${sourceAnchorId(number)}`,
  locale = "tr",
  className,
}: SourceRefProps) {
  const strings = getUiStrings(locale);

  return (
    <a
      href={href}
      className={cx(
        "relative z-10 inline-flex min-h-tap min-w-tap items-center justify-center type-data text-ink underline decoration-1 underline-offset-[3px] hover:decoration-2",
        className,
      )}
    >
      <span aria-hidden="true">{formatSourceCode(number)}</span>
      <VisuallyHidden>{strings.source(number)}</VisuallyHidden>
    </a>
  );
}

type SourceRefListProps = {
  numbers: readonly number[];
  /** Visible lead-in; defaults to "İlgili kaynaklar". */
  label?: string;
  hrefFor?: (number: number) => string;
  locale?: UiLocale;
  className?: string;
};

export function SourceRefList({
  numbers,
  label,
  hrefFor,
  locale = "tr",
  className,
}: SourceRefListProps) {
  if (numbers.length === 0) return null;
  const strings = getUiStrings(locale);

  return (
    <p
      className={cx(
        "flex flex-wrap items-center gap-x-1 type-caption text-ink-muted",
        className,
      )}
    >
      <span className="mr-1">{label ?? strings.relatedSources}</span>
      {numbers.map((number) => (
        <SourceRef
          key={number}
          number={number}
          href={hrefFor ? hrefFor(number) : undefined}
          locale={locale}
        />
      ))}
    </p>
  );
}
