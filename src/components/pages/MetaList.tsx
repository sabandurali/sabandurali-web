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
  /**
   * `inline` for a row under a title, `grid` for a fact sheet, `sidebar`
   * for a fact sheet that becomes one column beside the text on wide
   * screens.
   */
  layout?: "inline" | "grid" | "sidebar";
  className?: string;
};

const layoutClassName = {
  inline: "flex flex-wrap gap-x-8 gap-y-4",
  grid: "grid gap-x-8 gap-y-5 sm:grid-cols-2",
  sidebar: "grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-1",
} as const;

/** Label/value pairs (publication dates, book details, EXIF). */
export default function MetaList({
  items,
  layout = "inline",
  className,
}: MetaListProps) {
  if (items.length === 0) return null;

  return (
    <dl className={cx("m-0", layoutClassName[layout], className)}>
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
