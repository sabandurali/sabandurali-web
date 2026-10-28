import { cx } from "./cx";
import { getUiStrings, type UiLocale } from "./strings";
import VisuallyHidden from "./VisuallyHidden";

type GridRefProps = {
  /** Square reference on the schematic map, e.g. "F2". */
  value: string;
  /** `chip` is outlined (cards, hero); `plain` sits inline in a list. */
  variant?: "chip" | "plain";
  /** Prefix "Harita karesi" for screen readers; off when the text around
   * already says it ("Haritada F2"). */
  announce?: boolean;
  locale?: UiLocale;
  className?: string;
};

/**
 * A schematic-map square address: column letter + row number. Letters skip
 * I and O (İ/ı and 0 look alike) and K (the Bosphorus band has no letter),
 * so a grid reference never reads like a source code or a north arrow.
 */
export default function GridRef({
  value,
  variant = "chip",
  announce = true,
  locale = "tr",
  className,
}: GridRefProps) {
  const strings = getUiStrings(locale);

  return (
    <span
      className={cx(
        "type-data text-ink",
        variant === "chip" &&
          "inline-flex items-center rounded-card border-[1.5px] border-ink px-[7px] py-[3px]",
        className,
      )}
    >
      {announce ? <VisuallyHidden>{strings.gridRef} </VisuallyHidden> : null}
      {value}
    </span>
  );
}
