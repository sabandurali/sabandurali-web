import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

type HomeSectionHeadingProps = {
  /** Id of the h2, for the section's aria-labelledby. */
  id: string;
  /** Plate number ("01"): decorative, the heading carries the meaning. */
  number?: string;
  eyebrow?: string;
  title: string;
  /** Intro paragraph under the title. */
  children?: ReactNode;
  /** A call to action beside the heading (e.g. "Tüm makaleler"). */
  action?: ReactNode;
  tone?: "ink" | "on-sea";
  className?: string;
};

/**
 * Home section heading: signal plate number, eyebrow, `type-h2-lg` title,
 * optional intro and a link beside it on wide screens.
 */
export default function HomeSectionHeading({
  id,
  number,
  eyebrow,
  title,
  children,
  action,
  tone = "ink",
  className,
}: HomeSectionHeadingProps) {
  const muted = tone === "on-sea" ? "text-on-sea-muted" : "text-ink-muted";

  return (
    <div
      className={cx(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10",
        className,
      )}
    >
      <div className="max-w-measure min-w-0">
        {number !== undefined || eyebrow !== undefined ? (
          <p className="m-0 mb-3 flex items-center gap-3">
            {number !== undefined ? (
              <span
                aria-hidden="true"
                className="inline-flex min-w-9 items-center justify-center rounded-tile bg-signal px-1.5 py-1 type-data font-bold text-ink"
              >
                {number}
              </span>
            ) : null}
            {eyebrow !== undefined ? (
              <span className={cx("type-region", muted)}>{eyebrow}</span>
            ) : null}
          </p>
        ) : null}
        <h2 id={id} className="m-0 type-h2-lg">
          {title}
        </h2>
        {children ? (
          <div className={cx("mt-3 type-body", muted)}>{children}</div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
