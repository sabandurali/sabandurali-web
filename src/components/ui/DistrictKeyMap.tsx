import { cx } from "./cx";
import {
  bosphorusGridColumn,
  getDistrictTiles,
  tileGridColumn,
  tileGridColumnCount,
} from "./district-tile-grid";

type DistrictKeyMapProps = {
  /** Signal square with an ink edge: the district of the page or card. */
  featuredSlug?: string;
  /** Darker squares, e.g. the neighbours a guide names. */
  highlightSlugs?: readonly string[];
  /** Accessible name. Without it the map is decorative (aria-hidden): use
   * a caption or nearby text to say what it shows. */
  title?: string;
  className?: string;
};

const unit = 10;
const square = 9;

/** Small schematic key map of the 39 squares and the Bosphorus band. */
export default function DistrictKeyMap({
  featuredSlug,
  highlightSlugs = [],
  title,
  className,
}: DistrictKeyMapProps) {
  const tiles = getDistrictTiles();
  // Grid line 1 is the ruler column of the large map; the key map has none.
  const width = (tileGridColumnCount - 1) * unit;

  return (
    <svg
      viewBox={`0 0 ${width} 50`}
      focusable="false"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      className={cx("block h-auto w-full", className)}
    >
      {title ? <title>{title}</title> : null}
      <rect
        x={(bosphorusGridColumn - 2) * unit + 0.5}
        y={0.5}
        width={square}
        height={49}
        className="fill-sea"
      />
      {tiles.map((tile) => {
        const featured = tile.slug === featuredSlug;
        const highlighted = highlightSlugs.includes(tile.slug);

        return (
          <rect
            key={tile.slug}
            x={(tileGridColumn(tile.col) - 2) * unit + 0.5}
            y={(tile.row - 1) * unit + 0.5}
            width={square}
            height={square}
            strokeWidth={featured ? 0.8 : undefined}
            className={
              featured
                ? "fill-signal stroke-ink"
                : highlighted
                  ? "fill-sea-track"
                  : "fill-keymap"
            }
          />
        );
      })}
    </svg>
  );
}
