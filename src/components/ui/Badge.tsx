import type { ReactNode } from "react";
import { cx } from "./cx";

type BadgeProps = {
  children: ReactNode;
  /**
   * `signal`: new or highlighted (ink on signal orange, 4.77:1).
   * `neutral`: a quiet tag (ink on band). `soon`: not yet available
   * (signal-ink text, ≥ 4.87:1 on every light ground).
   */
  tone?: "signal" | "neutral" | "soon";
  className?: string;
};

const toneClassName = {
  signal: "bg-signal px-1.5 py-0.5 text-ink",
  neutral: "bg-band px-1.5 py-0.5 text-ink",
  soon: "text-signal-ink",
} as const;

/** Short status label. The text carries the meaning; colour only repeats it. */
export default function Badge({
  children,
  tone = "signal",
  className,
}: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-card font-mono text-label font-bold tabular-nums [font-stretch:var(--stretch-mono)]",
        toneClassName[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
