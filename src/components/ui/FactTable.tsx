import type { ReactNode } from "react";
import { cx } from "./cx";
import { SourceRef } from "./SourceRef";
import { getUiStrings, type UiLocale } from "./strings";
import VisuallyHidden from "./VisuallyHidden";

export type Fact = {
  id: string;
  label: string;
  /** Already formatted for the locale, e.g. "419.878", "18,43". Empty when
   * `extra` carries the value (line chips). */
  value: string;
  /** Unit after the value: "kişi", "km²", "mahalle". */
  unit?: string;
  /** `text` values ("Avrupa Yakası") are set in Archivo, not mono. */
  kind?: "number" | "text";
  /** Data or observation date as shown: "2025", "09.09.2026". */
  date?: string;
  /** ISO form of `date` for <time>, when it is a real date. */
  dateTime?: string;
  /** Numbers of the sources in the page's source list. */
  sources?: readonly number[];
  /** Extra content after the value, e.g. line chips. */
  extra?: ReactNode;
};

type FactTableProps = {
  facts: readonly Fact[];
  /** Note under the facts: data year rules, date caveats. */
  caption?: ReactNode;
  hrefForSource?: (number: number) => string;
  locale?: UiLocale;
  className?: string;
};

const columns =
  "@2xl:grid @2xl:grid-cols-[minmax(8rem,1.1fr)_minmax(9rem,1.5fr)_minmax(6.5rem,1fr)_minmax(6rem,1fr)] @2xl:items-baseline @2xl:gap-x-5";

/**
 * Key facts as a description list: label, mono value with unit, data date
 * and source references. In a narrow container each fact is a stacked block
 * with inline labels; from 42 rem it becomes a four-column grid with a
 * visual header row (the inline labels stay for screen readers).
 */
export default function FactTable({
  facts,
  caption,
  hrefForSource,
  locale = "tr",
  className,
}: FactTableProps) {
  const strings = getUiStrings(locale);

  return (
    <div className={cx("@container", className)}>
      <div
        aria-hidden="true"
        className={cx(
          "hidden border-b-2 border-ink pb-2 type-caption font-bold",
          columns,
        )}
      >
        <span>{strings.fact.indicator}</span>
        <span>{strings.fact.value}</span>
        <span>{strings.fact.date}</span>
        <span>{strings.fact.source}</span>
      </div>
      <dl className="m-0 border-t-2 border-ink @2xl:border-t-0">
        {facts.map((fact) => (
          <div
            key={fact.id}
            className={cx(
              "grid gap-y-1 border-b border-hairline py-3 @2xl:py-2",
              columns,
            )}
          >
            <dt className="font-semibold">{fact.label}</dt>
            <dd className="m-0 flex flex-wrap items-baseline gap-x-1.5 gap-y-1.5">
              {fact.value ? (
                fact.kind === "text" ? (
                  <span className="font-semibold">{fact.value}</span>
                ) : (
                  <span className="type-data-lg whitespace-nowrap">
                    {fact.value}
                  </span>
                )
              ) : null}
              {fact.unit ? (
                <span className="type-caption text-ink-muted">{fact.unit}</span>
              ) : null}
              {fact.extra}
            </dd>
            {/* Empty date and source cells only show in the wide grid,
                where the column needs a mark; stacked facts just omit them. */}
            <dd className={cx("m-0", !fact.date && "hidden @2xl:block")}>
              <span className="type-caption text-ink-muted @2xl:sr-only">
                {strings.fact.date}:{" "}
              </span>
              {fact.date ? (
                <span className="type-data-md">
                  {fact.dateTime ? (
                    <time dateTime={fact.dateTime}>{fact.date}</time>
                  ) : (
                    fact.date
                  )}
                </span>
              ) : (
                <>
                  <span aria-hidden="true" className="text-ink-muted">
                    —
                  </span>
                  <VisuallyHidden>{strings.none}</VisuallyHidden>
                </>
              )}
            </dd>
            <dd
              className={cx(
                "m-0 flex-wrap items-center",
                fact.sources && fact.sources.length > 0
                  ? "flex"
                  : "hidden @2xl:flex",
              )}
            >
              {fact.sources && fact.sources.length > 0 ? (
                <>
                  <span
                    aria-hidden="true"
                    className="mr-1 type-caption text-ink-muted @2xl:hidden"
                  >
                    {strings.fact.source}:
                  </span>
                  {fact.sources.map((number) => (
                    <SourceRef
                      key={number}
                      number={number}
                      href={hrefForSource ? hrefForSource(number) : undefined}
                      locale={locale}
                      className="-my-2"
                    />
                  ))}
                </>
              ) : (
                <>
                  <span aria-hidden="true" className="text-ink-muted">
                    —
                  </span>
                  <VisuallyHidden>
                    {strings.fact.source}: {strings.none}
                  </VisuallyHidden>
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>
      {caption ? (
        <p className="mt-3 max-w-measure type-caption text-ink-muted">
          {caption}
        </p>
      ) : null}
    </div>
  );
}
