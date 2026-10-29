import { Fragment, type ReactNode } from "react";
import { cx } from "./cx";
import { LineChip } from "./LineChip";
import {
  getSegmentStyles,
  type DiagramStation,
  type SegmentStyle,
} from "./station-diagram";
import { getUiStrings, type UiLocale } from "./strings";
import VisuallyHidden from "./VisuallyHidden";

type StationDiagramProps = {
  /** Line code shown as a LineChip, e.g. "M1B". */
  code: string;
  /** Line name: "Yenikapı–Kirazlı". */
  name: string;
  /** Short line note: "İlçe içinde: Esenler, Menderes, Üçyüzlü". */
  note?: ReactNode;
  /** Stations in line order. Only stations named in the text: the diagram
   * is schematic and says so in the legend. */
  stations: readonly DiagramStation[];
  /** Accessible name of the station list. */
  label: string;
  locale?: UiLocale;
  className?: string;
};

/** Lets long names break after an en dash ("Giyimkent–Tekstilkent"). */
function breakableName(name: string): ReactNode {
  const parts = name.split("–");
  return parts.map((part, index) => (
    <Fragment key={index}>
      {part}
      {index < parts.length - 1 ? (
        <>
          –<wbr />
        </>
      ) : null}
    </Fragment>
  ));
}

/* One segment per gap, from this stop's centre to the next one's: stops are
   evenly spaced (equal flex items, or equal-height rows starting at the same
   offset), so 100 % of the rail box reaches the next centre and dotted
   patterns never restart halfway. */
function railClassName(style: SegmentStyle) {
  return cx(
    "absolute top-[17px] left-[7px] h-full w-0 border-l-4 border-ink",
    style === "solid" ? "border-solid" : "border-dotted",
    "@xl:top-2 @xl:left-1/2 @xl:h-0 @xl:w-full @xl:border-t-4 @xl:border-l-0",
  );
}

/**
 * Schematic rail line: stops in order, signal stops for stations that serve
 * the district, solid line between them and dotted where the line leaves the
 * district. The fill is decorative: a serving station also says so in text
 * for screen readers (colour never carries the information alone). A vertical list in narrow containers (no cramped labels at
 * 390 px), a horizontal line from a 36 rem container width.
 */
export default function StationDiagram({
  code,
  name,
  note,
  stations,
  label,
  locale = "tr",
  className,
}: StationDiagramProps) {
  const segments = getSegmentStyles(stations);
  const strings = getUiStrings(locale);

  return (
    <div
      className={cx(
        "@container rounded-card border border-ink bg-land px-[clamp(0.75rem,2vw,1.375rem)] py-4 text-ink",
        className,
      )}
    >
      <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <LineChip code={code} locale={locale} />
        <span className="text-body leading-tight font-bold">{name}</span>
        {note ? (
          <span className="type-small text-ink-muted">{note}</span>
        ) : null}
      </p>
      <ol aria-label={label} className="m-0 mt-4 list-none p-0 @xl:flex">
        {stations.map((station, index) => {
          const toNext = segments[index];

          return (
            <li
              key={`${index}-${station.name}`}
              className="relative flex gap-3 @xl:min-w-0 @xl:flex-1 @xl:flex-col @xl:items-center @xl:gap-1.5 @xl:text-center"
            >
              <span
                aria-hidden="true"
                className="relative w-[18px] shrink-0 self-stretch @xl:h-5 @xl:w-full @xl:self-auto"
              >
                {toNext ? <span className={railClassName(toNext)} /> : null}
                <span
                  className={cx(
                    "absolute top-2 left-0 size-[18px] rounded-full border-[3px] border-ink @xl:top-px @xl:left-1/2 @xl:-translate-x-1/2",
                    station.serves ? "bg-signal" : "bg-land",
                  )}
                />
              </span>
              <span className="flex min-w-0 flex-col py-2 @xl:py-0">
                <span className="text-small leading-tight font-bold [font-stretch:var(--stretch-display)] @xl:text-caption">
                  {breakableName(station.name)}
                  {station.serves ? (
                    <VisuallyHidden>{strings.stationServes}</VisuallyHidden>
                  ) : null}
                </span>
                {station.note ? (
                  <span className="text-label leading-tight text-ink-muted">
                    {station.note}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
