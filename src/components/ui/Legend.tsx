import type { ReactNode } from "react";
import { cx } from "./cx";

export type LegendSwatch =
  | "tile"
  | "tile-featured"
  | "tile-neighbour"
  | "sea"
  | "line-solid"
  | "line-dotted"
  | "line-dashed"
  | "station"
  | "station-serves"
  | "stop-pending";

const swatchClassName: Record<LegendSwatch, string> = {
  tile: "size-4 border border-tile-edge bg-land",
  "tile-featured": "size-4 border-2 border-ink bg-signal",
  "tile-neighbour": "size-4 border border-tile-edge bg-mist",
  sea: "size-4 bg-sea",
  "line-solid": "h-0 w-6 border-t-4 border-solid border-ink",
  "line-dotted": "h-0 w-6 border-t-4 border-dotted border-ink",
  "line-dashed": "h-0 w-6 border-t-[3px] border-dashed border-ink-muted",
  station: "size-3.5 rounded-full border-[3px] border-ink bg-white",
  "station-serves": "size-3.5 rounded-full border-[3px] border-ink bg-signal",
  "stop-pending": "size-3.5 rounded-full border-[3px] border-dashed border-ink",
};

export type LegendItem = { swatch: LegendSwatch; label: ReactNode };

type LegendProps = {
  items: readonly LegendItem[];
  /** Visible title, e.g. "Lejant". */
  title?: string;
  className?: string;
};

/** Key for map and diagram symbols. Swatches are decorative; every symbol
 * is named in text. */
export default function Legend({ items, title, className }: LegendProps) {
  return (
    <div className={cx("type-caption text-ink", className)}>
      {title ? <p className="m-0 mb-2 font-bold">{title}</p> : null}
      <ul className="m-0 flex list-none flex-wrap gap-x-[18px] gap-y-1.5 p-0">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cx("block shrink-0", swatchClassName[item.swatch])}
            />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
