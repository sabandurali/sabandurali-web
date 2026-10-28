import type { ReactNode } from "react";
import { cx } from "./cx";

type ChipProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Outlined mono label for data context ("Eylül 2026 itibarıyla",
 * "Haritada F2"). Not interactive; it inherits the text colour, so it works
 * on paper and on sea.
 */
export default function Chip({ children, className }: ChipProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-card border-[1.5px] border-current px-[7px] py-[3px] type-data",
        className,
      )}
    >
      {children}
    </span>
  );
}
