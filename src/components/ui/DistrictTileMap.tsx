import { createElement, useId, type ReactNode } from "react";
import { getDistrictPath } from "@/content/districts/district-routes";
import type { DistrictSide } from "@/content/districts/district-registry";
import { cx } from "./cx";
import DistrictKeyMap from "./DistrictKeyMap";
import {
  bosphorusGridColumn,
  eastColumns,
  getDistrictTiles,
  sortTilesByName,
  tileGridColumn,
  tileGridRow,
  tileRows,
  westColumns,
  type DistrictTile,
  type TileColumn,
} from "./district-tile-grid";
import { ArrowUpRightIcon, NorthArrowIcon } from "./icons";
import Legend from "./Legend";
import { getUiStrings, type UiLocale } from "./strings";
import UiLink from "./UiLink";
import VisuallyHidden from "./VisuallyHidden";

type DistrictTileMapProps = {
  /** Signal tile: the guide the page puts forward. */
  featuredSlug?: string;
  /** The district of the current page: shown, not linked (aria-current). */
  currentSlug?: string;
  /** Mist tiles, e.g. neighbours named by the current guide. */
  highlightSlugs?: readonly string[];
  /** Link of a district; defaults to its Turkish guide path. */
  getHref?: (slug: string) => string;
  /** Level of the two side headings in the phone layout. */
  groupHeadingLevel?: 2 | 3 | 4;
  /** Extra caption sentence after the standard schematic note. */
  caption?: ReactNode;
  locale?: UiLocale;
  className?: string;
};

type TileState = "default" | "featured" | "current" | "highlight";

function tileState(
  tile: DistrictTile,
  { featuredSlug, currentSlug, highlightSlugs = [] }: DistrictTileMapProps,
): TileState {
  if (tile.slug === currentSlug) return "current";
  if (tile.slug === featuredSlug) return "featured";
  if (highlightSlugs.includes(tile.slug)) return "highlight";
  return "default";
}

type TileLayout = "grid" | "list";

/** Every property is set by exactly one entry, so no two classes compete. */
function tileClassName(layout: TileLayout, state: TileState): string {
  const marked = state === "featured" || state === "current";

  return cx(
    "rounded-tile text-ink",
    layout === "grid"
      ? "flex aspect-square min-w-0 flex-col p-1.5 text-tile break-words hyphens-manual"
      : "flex min-h-12 items-center justify-between gap-2 px-2.5 py-1.5 text-small leading-tight [font-stretch:var(--stretch-compact)]",
    layout === "grid" &&
      (marked
        ? "justify-between [font-stretch:var(--stretch-compact)]"
        : "justify-end [font-stretch:var(--stretch-tile)]"),
    marked
      ? "border-2 border-ink bg-signal font-extrabold"
      : cx(
          "border border-tile-edge font-semibold",
          state === "highlight" ? "bg-mist" : "bg-land",
        ),
  );
}

/** Tile content: the name, and for the featured tile an arrow cue. */
function TileContent({
  tile,
  state,
  layout,
  locale,
}: {
  tile: DistrictTile;
  state: TileState;
  layout: TileLayout;
  locale: UiLocale;
}) {
  const strings = getUiStrings(locale);
  const marked = state === "featured" || state === "current";

  return (
    <>
      {marked && layout === "grid" ? (
        <ArrowUpRightIcon size={16} className="self-end" />
      ) : null}
      <span className="min-w-0">
        {layout === "grid" ? tile.label : tile.name}
      </span>
      {state === "featured" ? (
        <VisuallyHidden>, {strings.map.featuredTile}</VisuallyHidden>
      ) : null}
      {layout === "list" ? (
        <span
          aria-hidden="true"
          className={cx(
            "shrink-0 type-data",
            marked ? "text-ink" : "text-ink-muted",
          )}
        >
          {tile.ref}
        </span>
      ) : null}
    </>
  );
}

function Tile({
  tile,
  state,
  href,
  layout,
  locale,
}: {
  tile: DistrictTile;
  state: TileState;
  href: string;
  layout: TileLayout;
  locale: UiLocale;
}) {
  const content = (
    <TileContent tile={tile} state={state} layout={layout} locale={locale} />
  );
  const className = tileClassName(layout, state);

  if (state === "current") {
    return (
      <span aria-current="page" className={className}>
        {content}
      </span>
    );
  }

  return (
    <UiLink
      href={href}
      prefetch={false}
      className={cx(
        className,
        "no-underline hover:border-ink hover:underline",
        state !== "featured" && "hover:bg-white",
      )}
    >
      {content}
    </UiLink>
  );
}

/** Alternating ruler bar, like the edge scale of a printed map sheet. */
function rulerBarClassName(index: number, active: boolean) {
  if (active) return "border border-ink bg-signal";
  return index % 2 === 0 ? "bg-ink" : "border border-ink bg-land";
}

/**
 * The atlas: all 39 districts as a schematic, unscaled tile map split by the
 * Bosphorus band. Every tile is a link named by the district. When the map
 * itself is at least 72 rem wide (a container query, so a narrow column
 * on a wide screen also gets the compact form) the full grid is shown
 * with square references on the edges; below that, a key map and two
 * side-grouped tile lists, so phones never scroll sideways. The grid needs
 * tiles of about 70 px: at 64 rem they are 55 px wide, names such as
 * "Bağcılar" break mid-word and the north arrow runs into Adalar. Place it
 * on a light ground (Section tone paper, land or band).
 */
export default function DistrictTileMap(props: DistrictTileMapProps) {
  const {
    featuredSlug,
    getHref = getDistrictPath,
    groupHeadingLevel = 3,
    caption,
    locale = "tr",
    className,
  } = props;
  const strings = getUiStrings(locale);
  const baseId = useId();
  const tiles = getDistrictTiles();
  const featured = tiles.find((tile) => tile.slug === featuredSlug);
  const marked = tiles.find(
    (tile) => tile.slug === props.currentSlug || tile.slug === featuredSlug,
  );
  const sides: { side: DistrictSide; title: string; tiles: DistrictTile[] }[] =
    [
      {
        side: "avrupa",
        title: strings.map.europeCaps,
        tiles: sortTilesByName(tiles.filter((tile) => tile.side === "avrupa")),
      },
      {
        side: "anadolu",
        title: strings.map.asiaCaps,
        tiles: sortTilesByName(tiles.filter((tile) => tile.side === "anadolu")),
      },
    ];
  const europeCount = sides[0]?.tiles.length ?? 0;
  const asiaCount = sides[1]?.tiles.length ?? 0;
  const columnLetters: readonly TileColumn[] = [...westColumns, ...eastColumns];

  // The map draws its own light grounds, so it sets its own ink as well: its
  // labels never inherit a light text colour from a dark page around it.
  return (
    <figure className={cx("@container m-0 text-ink", className)}>
      {/* Full atlas grid (map at least 72 rem wide). */}
      <div className="hidden border-x border-b border-ink bg-paper @6xl:block">
        <div className="grid grid-cols-[28px_repeat(15,minmax(0,1fr))] grid-rows-[30px_repeat(5,auto)] gap-1 pt-2.5 pr-3.5 pb-3.5 pl-2">
          {columnLetters.map((letter, index) => {
            const active = marked?.col === letter;
            return (
              <span
                key={letter}
                aria-hidden="true"
                className={cx(
                  "row-start-1 flex flex-col items-center justify-end gap-[5px] type-data",
                  active ? "font-bold text-ink" : "font-medium text-ink-muted",
                )}
                style={{ gridColumn: tileGridColumn(letter) }}
              >
                <span>{letter}</span>
                <span
                  className={cx(
                    "block h-[5px] w-full",
                    rulerBarClassName(index, active),
                  )}
                />
              </span>
            );
          })}
          {tileRows.map((row, index) => {
            const active = marked?.row === row;
            return (
              <span
                key={row}
                aria-hidden="true"
                className={cx(
                  "col-start-1 flex items-center justify-end gap-[5px] type-data",
                  active ? "font-bold text-ink" : "font-medium text-ink-muted",
                )}
                style={{ gridRow: tileGridRow(row) }}
              >
                <span>{row}</span>
                <span
                  className={cx(
                    "block w-[5px] self-stretch",
                    rulerBarClassName(index, active),
                  )}
                />
              </span>
            );
          })}

          <p className="col-start-2 col-end-5 row-start-2 m-0 flex flex-col gap-[3px] self-center pl-1">
            <span className="w-min type-region">{strings.map.europeCaps}</span>
            <span className="type-data font-medium text-ink-muted">
              {strings.map.count(europeCount)}
            </span>
          </p>
          <p className="col-start-13 col-end-15 row-start-2 m-0 flex flex-col gap-[3px] self-center pl-1">
            <span className="w-min type-region">{strings.map.asiaCaps}</span>
            <span className="type-data font-medium text-ink-muted">
              {strings.map.count(asiaCount)}
            </span>
          </p>
          <p
            className="row-start-2 row-end-7 m-0 flex items-center justify-center rounded-tile bg-sea text-on-sea"
            style={{ gridColumn: bosphorusGridColumn }}
          >
            <span className="text-label leading-none font-bold tracking-[0.24em] [font-stretch:var(--stretch-wide)] [writing-mode:vertical-rl]">
              {strings.map.bosphorusCaps}
            </span>
          </p>

          <ul className="col-start-2 col-end-17 row-start-2 row-end-7 m-0 grid list-none grid-cols-subgrid grid-rows-subgrid p-0">
            {tiles.map((tile) => (
              <li
                key={tile.slug}
                className="min-w-0"
                style={{
                  gridColumn: tileGridColumn(tile.col) - 1,
                  gridRow: tile.row,
                }}
              >
                <Tile
                  tile={tile}
                  state={tileState(tile, props)}
                  href={getHref(tile.slug)}
                  layout="grid"
                  locale={locale}
                />
              </li>
            ))}
          </ul>

          <Legend
            title={strings.map.legend}
            items={[
              { swatch: "tile", label: strings.map.districtGuide },
              ...(featured
                ? [
                    {
                      swatch: "tile-featured" as const,
                      label: strings.map.featuredLegend(featured.name),
                    },
                  ]
                : []),
              { swatch: "sea", label: strings.map.bosphorus },
            ]}
            className="relative col-start-2 col-end-7 row-start-5 row-end-7 self-end rounded-tile border border-ink bg-land px-3 py-2.5"
          />
          <div className="relative col-start-14 col-end-17 row-start-6 flex items-center gap-3 self-center justify-self-end">
            <span
              aria-hidden="true"
              className="flex flex-col items-center gap-0.5 type-data font-bold text-ink"
            >
              <NorthArrowIcon />
              {strings.map.north}
            </span>
            <span className="inline-flex items-center rounded-card border-[1.5px] border-ink px-2.5 py-1.5 type-data whitespace-nowrap">
              {strings.map.schematic}
            </span>
          </div>
        </div>
      </div>

      {/* Compact atlas (narrower map): key map and side-grouped tiles. */}
      <div className="@6xl:hidden">
        <div className="flex flex-wrap items-end justify-between gap-3 border-x border-b border-ink bg-land p-3">
          <DistrictKeyMap
            featuredSlug={props.currentSlug ?? featuredSlug}
            highlightSlugs={props.highlightSlugs}
            className="max-w-[440px] min-w-0 flex-[1_1_15rem]"
          />
          <span className="inline-flex items-center rounded-card border-[1.5px] border-ink px-2.5 py-1.5 type-data whitespace-nowrap">
            {strings.map.schematic}
          </span>
        </div>
        <div className="mt-5 grid gap-6">
          {sides.map(({ side, title, tiles: sideTiles }) => {
            const headingId = `${baseId}-${side}`;
            return (
              <div key={side}>
                {createElement(
                  `h${groupHeadingLevel}`,
                  {
                    id: headingId,
                    className:
                      "m-0 flex items-baseline justify-between gap-3 border-b-2 border-ink pb-1.5 type-region",
                  },
                  <>
                    <span>{title}</span>
                    <span className="type-data font-medium tracking-normal text-ink-muted">
                      {strings.map.count(sideTiles.length)}
                    </span>
                  </>,
                )}
                <ul
                  aria-labelledby={headingId}
                  className="m-0 mt-2 grid list-none grid-cols-2 gap-1 p-0 @lg:grid-cols-3 @2xl:grid-cols-4"
                >
                  {sideTiles.map((tile) => (
                    <li key={tile.slug} className="min-w-0">
                      <Tile
                        tile={tile}
                        state={tileState(tile, props)}
                        href={getHref(tile.slug)}
                        layout="list"
                        locale={locale}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <figcaption className="flex flex-wrap justify-between gap-x-8 gap-y-1.5 pt-3 type-small text-ink-muted">
        <span className="max-w-[78ch]">
          {strings.map.caption}
          {featured
            ? ` ${strings.map.featured(featured.name, featured.ref)}`
            : null}
          {caption ? <> {caption}</> : null}
        </span>
      </figcaption>
    </figure>
  );
}
