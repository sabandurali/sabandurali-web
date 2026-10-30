import type { ReactNode } from "react";
import { cx } from "./cx";

type EmptyStateProps = {
  /** What is missing, stated plainly: "… henüz eklenmedi." */
  children: ReactNode;
  /** Optional follow-up line under the panel (where to look meanwhile). */
  note?: ReactNode;
  size?: "md" | "lg";
  className?: string;
};

/**
 * Explicit empty state for missing data: a hatched panel with the message
 * on a solid label. Never filler content, never a fake number.
 */
export default function EmptyState({
  children,
  note,
  size = "md",
  className,
}: EmptyStateProps) {
  return (
    <div className={cx("max-w-[47.5rem]", className)}>
      <div
        className={cx(
          "flex items-center rounded-card border border-ink bg-hatch px-5",
          size === "lg" ? "min-h-45 py-7" : "py-7",
        )}
      >
        <p className="m-0 inline-block bg-land px-3.5 py-2.5 type-body font-semibold text-ink">
          {children}
        </p>
      </div>
      {note ? (
        <p className="mt-4 max-w-measure type-small text-ink-muted">{note}</p>
      ) : null}
    </div>
  );
}
