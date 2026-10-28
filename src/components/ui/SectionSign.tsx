import { ArrowDownIcon, EndSquareIcon } from "./icons";
import { cx } from "./cx";
import { getUiStrings, type UiLocale } from "./strings";
import VisuallyHidden from "./VisuallyHidden";

type SectionSignProps = {
  number: number;
  /** Number of stops on the route (for "01/12"). */
  total?: number;
  /** Wayfinding name of the section, e.g. "Bir bakışta". */
  label: string;
  /**
   * `p` when an editorial <h2> follows the plate (district guide);
   * a heading level when the plate itself is the section heading.
   */
  as?: "p" | "h2" | "h3";
  id?: string;
  /** Last stop: a square instead of the "continue" arrow. */
  end?: boolean;
  locale?: UiLocale;
  className?: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/**
 * Wayfinding plate: signal-orange stop number, sea-blue name panel and a
 * direction cell, like a station sign. Screen readers hear
 * "Bölüm 1, 12 bölümden: Bir bakışta" instead of "01/12".
 */
export default function SectionSign({
  number,
  total,
  label,
  as: Tag = "p",
  id,
  end = false,
  locale = "tr",
  className,
}: SectionSignProps) {
  const strings = getUiStrings(locale);

  return (
    <Tag
      id={id}
      className={cx(
        "m-0 inline-flex max-w-full items-stretch overflow-hidden rounded-control bg-sea text-on-sea",
        className,
      )}
    >
      <span className="flex shrink-0 items-baseline bg-signal px-3 py-[9px] font-mono text-sign font-bold tracking-normal text-ink [font-stretch:var(--stretch-mono)]">
        <span aria-hidden="true">
          {pad(number)}
          {total ? (
            <span className="text-label font-medium">/{pad(total)}</span>
          ) : null}
        </span>
        <VisuallyHidden>{strings.sectionOf(number, total)}: </VisuallyHidden>
      </span>
      <span className="flex min-w-0 items-center px-4 py-[9px] type-sign tracking-normal">
        {label}
      </span>
      <span
        aria-hidden="true"
        className="flex shrink-0 items-center border-l border-sea-line px-3"
      >
        {end ? <EndSquareIcon /> : <ArrowDownIcon />}
      </span>
    </Tag>
  );
}
