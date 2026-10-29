import type { ReactNode } from "react";
import Breadcrumb, { type BreadcrumbItem } from "@/components/ui/Breadcrumb";
import { cx } from "@/components/ui/cx";
import Section from "@/components/ui/Section";
import type { UiLocale } from "@/components/ui/strings";

type PageIntroProps = {
  locale: UiLocale;
  breadcrumb: readonly BreadcrumbItem[];
  /** Short line above the title: section name or category. */
  eyebrow?: ReactNode;
  title: string;
  /** Lead paragraph under the title. */
  lead?: ReactNode;
  /** Facts, actions or a cover beside the text on wide screens. */
  aside?: ReactNode;
  /** Dates, counts and links under the lead. */
  children?: ReactNode;
  titleId?: string;
};

/**
 * Opening block of a publication page: breadcrumb, eyebrow with the single
 * signal square, the page's only h1, lead and meta. Text stays within the
 * reading measure; an optional aside (a book cover) sits beside it from the
 * large breakpoint.
 */
export default function PageIntro({
  locale,
  breadcrumb,
  eyebrow,
  title,
  lead,
  aside,
  children,
  titleId = "page-title",
}: PageIntroProps) {
  return (
    <Section tone="paper" spacing="none" className="pt-6 pb-10 sm:pb-14">
      <Breadcrumb items={breadcrumb} locale={locale} />
      <div
        className={cx(
          "mt-8 sm:mt-10",
          aside !== undefined &&
            "grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] lg:items-start lg:gap-16",
        )}
      >
        <div className="min-w-0">
          {eyebrow ? (
            <p className="m-0 flex items-center gap-2.5 type-label text-ink-muted">
              <span aria-hidden="true" className="size-2.5 shrink-0 bg-signal" />
              <span>{eyebrow}</span>
            </p>
          ) : null}
          <h1
            id={titleId}
            className="mt-4 max-w-[24ch] type-display break-words hyphens-auto"
          >
            {title}
          </h1>
          {lead ? (
            <div className="mt-5 max-w-measure type-lead text-ink">{lead}</div>
          ) : null}
          {children}
        </div>
        {aside}
      </div>
    </Section>
  );
}
