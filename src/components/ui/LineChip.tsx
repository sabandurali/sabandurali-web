import { cx } from "./cx";
import { getUiStrings, type UiLocale } from "./strings";
import VisuallyHidden from "./VisuallyHidden";

type LineChipProps = {
  /** Rail line code, e.g. "M1B", "M7", "T4". */
  code: string;
  /**
   * `serves`: a line of this district (filled sea). `other`: a connecting
   * or nearby line (outlined, muted). `on-sea`: a serving line on a sea
   * ground (filled white).
   */
  variant?: "serves" | "other" | "on-sea";
  locale?: UiLocale;
  className?: string;
};

const variantClassName = {
  serves: "bg-sea text-on-sea",
  other: "border-2 border-ink-muted text-ink-muted",
  "on-sea": "bg-on-sea text-sea",
} as const;

/** Transit line code. Only line codes use this rounded chip shape. */
export function LineChip({
  code,
  variant = "serves",
  locale = "tr",
  className,
}: LineChipProps) {
  const strings = getUiStrings(locale);

  return (
    <span
      className={cx(
        "inline-flex h-7 min-w-11 shrink-0 items-center justify-center rounded-chip px-2 font-mono text-caption font-bold leading-none [font-stretch:var(--stretch-mono)]",
        variantClassName[variant],
        className,
      )}
    >
      {code}
      <VisuallyHidden> {strings.line}</VisuallyHidden>
    </span>
  );
}

type StationMarkerProps = {
  /** Station or institution name, e.g. "Davutpaşa–YTÜ". */
  name: string;
  /** Filled signal ring: the station serves the district. */
  serves?: boolean;
  className?: string;
};

/**
 * A station or an institution beside the line (YTÜ, a terminal): the ring
 * glyph of the station diagrams plus the name, never a chip, so it cannot be
 * mistaken for a line code.
 */
export function StationMarker({
  name,
  serves = false,
  className,
}: StationMarkerProps) {
  return (
    <span className={cx("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className={cx(
          "size-4 shrink-0 rounded-full border-[3px] border-ink",
          serves ? "bg-signal" : "bg-land",
        )}
      />
      <span className="font-semibold">{name}</span>
    </span>
  );
}
