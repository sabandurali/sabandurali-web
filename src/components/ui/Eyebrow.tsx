import type { ReactNode } from "react";
import { cx } from "./cx";

type EyebrowProps = {
  children: ReactNode;
  /** Section number, shown in mono before the label ("02"). */
  number?: number;
  tone?: "ink" | "on-sea";
  className?: string;
};

/**
 * Short label above a heading: a signal-orange rule (a fill, never orange
 * text), an optional mono number and the label.
 */
export default function Eyebrow({
  children,
  number,
  tone = "ink",
  className,
}: EyebrowProps) {
  return (
    <p
      className={cx(
        "m-0 flex items-center gap-3 type-label",
        tone === "on-sea" ? "text-on-sea-muted" : "text-ink-muted",
        className,
      )}
    >
      <span aria-hidden="true" className="h-1 w-8 shrink-0 bg-signal" />
      {number !== undefined ? (
        <span className="type-data font-bold">
          {String(number).padStart(2, "0")}
        </span>
      ) : null}
      <span>{children}</span>
    </p>
  );
}
