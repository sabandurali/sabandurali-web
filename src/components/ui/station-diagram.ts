export type DiagramStation = {
  name: string;
  /** Short note under the name: "ilçe içinde", "hat ucu", "M3 aktarması". */
  note?: string;
  /** The station serves the district (signal stop, solid line between). */
  serves?: boolean;
};

export type SegmentStyle = "solid" | "dotted";

/**
 * Line style between consecutive stations: solid where both stations serve
 * the district, dotted where the line runs outside it. One entry fewer
 * than there are stations.
 */
export function getSegmentStyles(
  stations: readonly DiagramStation[],
): SegmentStyle[] {
  return stations.slice(1).map((station, index) => {
    const previous = stations[index];
    return previous?.serves && station.serves ? "solid" : "dotted";
  });
}
