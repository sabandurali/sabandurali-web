import type { ReactNode } from "react";
import Breadcrumb, { type BreadcrumbItem } from "@/components/ui/Breadcrumb";
import type { UiLocale } from "@/components/ui/strings";
import { cx } from "@/components/ui/cx";

type PageIntroProps = {
  /** Trail ending with the current page; omitted when empty. */
  breadcrumb?: readonly BreadcrumbItem[];
  /** Short label above the title ("İLETİŞİM", "03 — Çalışma alanı"). */
  eyebrow?: string;
  title: string;
  /** Lead paragraph under the title. */
  lead?: ReactNode;
  locale?: UiLocale;
  /** `display` for landing pages, `h2-lg` for reading pages. */
  size?: "display" | "h2-lg";
  /** Extra content under the lead (links, notes). */
  children?: ReactNode;
  className?: string;
};

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
export function Eyebrow({
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

/**
 * Page opening: breadcrumb, eyebrow, the page's only h1 and the lead. The
 * eyebrow is set in a short rule of signal orange (fill, not text).
 */
export default function PageIntro({
  breadcrumb,
  eyebrow,
  title,
  lead,
  locale = "tr",
  size = "display",
  children,
  className,
}: PageIntroProps) {
  return (
    <header className={cx("flex flex-col gap-5", className)}>
      {breadcrumb && breadcrumb.length > 0 ? (
        <Breadcrumb items={breadcrumb} locale={locale} />
      ) : null}
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h1
        className={cx(
          "m-0 max-w-[22ch] text-ink",
          size === "display" ? "type-display" : "type-h2-lg",
        )}
      >
        {title}
      </h1>
      {lead ? (
        <p className="m-0 max-w-measure type-lead text-ink">{lead}</p>
      ) : null}
      {children}
    </header>
  );
}
