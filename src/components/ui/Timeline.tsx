import type { ReactNode } from "react";
import { cx } from "./cx";
import { SourceRef } from "./SourceRef";
import type { UiLocale } from "./strings";

export type TimelineEntry = {
  id: string;
  /** Date as shown, in mono: "27.12.1993", "1923 sonrası", "Devam ediyor". */
  when: string;
  /** ISO date for <time> when `when` is a real date. */
  dateTime?: string;
  children: ReactNode;
  /** Filled signal stop: a key date or the current stage. */
  highlight?: boolean;
  sources?: readonly number[];
};

type TimelineProps = {
  /** Accessible name of the list, e.g. "Tarih çizelgesi". */
  label: string;
  entries: readonly TimelineEntry[];
  /**
   * `axis`: vertical history axis (district guides).
   * `route`: stops along a line (career route); horizontal from a 40 rem
   * container width, vertical below it.
   */
  variant?: "axis" | "route";
  /** Ground the timeline sits on. */
  tone?: "light" | "sea";
  hrefForSource?: (number: number) => string;
  locale?: UiLocale;
  className?: string;
};

function When({ entry }: { entry: TimelineEntry }) {
  const className = "type-data-md font-bold";
  return entry.dateTime ? (
    <time dateTime={entry.dateTime} className={className}>
      {entry.when}
    </time>
  ) : (
    <span className={className}>{entry.when}</span>
  );
}

/** Ordered dated stops. The stops and lines are decoration (aria-hidden):
 * order, dates and text carry the content. */
export default function Timeline({
  label,
  entries,
  variant = "axis",
  tone = "light",
  hrefForSource,
  locale = "tr",
  className,
}: TimelineProps) {
  const onSea = tone === "sea";
  const dot = (highlight?: boolean) =>
    cx(
      "size-[18px] rounded-full border-[3px]",
      onSea ? "border-on-sea" : "border-ink",
      highlight ? "bg-signal" : onSea ? "bg-sea" : "bg-land",
    );

  if (variant === "route") {
    return (
      <div className={cx("@container", className)}>
        <ol
          aria-label={label}
          className="m-0 grid list-none gap-y-5 p-0 @2xl:flex @2xl:gap-y-0"
        >
          {entries.map((entry, index) => {
            const isFirst = index === 0;
            const isLast = index === entries.length - 1;

            return (
              <li
                key={entry.id}
                className="relative grid grid-cols-[18px_1fr] gap-x-4 @2xl:flex @2xl:min-w-0 @2xl:flex-1 @2xl:flex-col @2xl:gap-y-2"
              >
                <span
                  aria-hidden="true"
                  className="relative row-span-2 block h-full @2xl:h-[18px] @2xl:w-full"
                >
                  {entries.length > 1 ? (
                    <span
                      className={cx(
                        "absolute left-[7px] w-1 @2xl:top-[7px] @2xl:h-1",
                        onSea ? "bg-sea-track" : "bg-ink",
                        isFirst
                          ? "top-[9px] @2xl:left-[9px]"
                          : "-top-5 @2xl:left-0",
                        isLast
                          ? "h-[29px] @2xl:w-[9px]"
                          : "bottom-0 @2xl:right-0 @2xl:w-auto",
                      )}
                    />
                  ) : null}
                  <span
                    className={cx(
                      "absolute top-0 left-0",
                      dot(entry.highlight),
                    )}
                  />
                </span>
                <When entry={entry} />
                <span
                  className={cx(
                    "type-small @2xl:pr-3",
                    onSea ? "text-on-sea-soft" : "text-ink-muted",
                  )}
                >
                  {entry.children}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  return (
    <ol
      aria-label={label}
      className={cx("m-0 ml-[9px] list-none p-0", className)}
    >
      {entries.map((entry, index) => {
        const isLast = index === entries.length - 1;

        return (
          <li
            key={entry.id}
            className={cx(
              "relative border-l-[3px] pl-7",
              onSea ? "border-sea-track" : "border-ink",
              isLast ? "pb-1" : "pb-[22px]",
            )}
          >
            <span
              aria-hidden="true"
              className={cx(
                "absolute top-0.5 -left-[10.5px]",
                dot(entry.highlight),
              )}
            />
            <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1">
              <When entry={entry} />
              {entry.sources?.map((number) => (
                <SourceRef
                  key={number}
                  number={number}
                  href={hrefForSource ? hrefForSource(number) : undefined}
                  tone={onSea ? "on-sea" : "ink"}
                  locale={locale}
                  className="-my-3"
                />
              ))}
            </p>
            <div className="mt-1 text-base leading-[1.55]">
              {entry.children}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
