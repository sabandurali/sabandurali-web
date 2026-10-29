import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

export type MetaItem = {
  label: string;
  value: ReactNode;
  /** ISO value for a <time> element when the value is a date. */
  dateTime?: string | null;
  /** Set values (dates, numbers, codes) in Martian Mono. */
  data?: boolean;
};

type MetaListProps = {
  items: readonly MetaItem[];
  /** `inline` for a row under a title, `grid` for a fact sheet. */
  layout?: "inline" | "grid";
  className?: string;
};

/** Label/value pairs (publication dates, book details, EXIF). */
export default function MetaList({
  items,
  layout = "inline",
  className,
}: MetaListProps) {
  if (items.length === 0) return null;

  return (
    <dl
      className={cx(
        "m-0",
        layout === "inline"
          ? "flex flex-wrap gap-x-8 gap-y-4"
          : "grid gap-x-8 gap-y-5 sm:grid-cols-2",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-col gap-1">
          <dt className="type-label text-ink-muted">{item.label}</dt>
          <dd
            className={cx(
              "m-0 break-words text-ink",
              item.data ? "type-data-md font-semibold" : "type-small",
            )}
          >
            {item.dateTime ? (
              <time dateTime={item.dateTime}>{item.value}</time>
            ) : (
              item.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
