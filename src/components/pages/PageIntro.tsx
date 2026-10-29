import type { ReactNode } from "react";
import Breadcrumb, { type BreadcrumbItem } from "@/components/ui/Breadcrumb";
import Container from "@/components/ui/Container";
import { cx } from "@/components/ui/cx";
import type { UiLocale } from "@/components/ui/strings";
import { Eyebrow } from "@/components/workspaces/PageIntro";

type PageIntroProps = {
  locale: UiLocale;
  breadcrumb: readonly BreadcrumbItem[];
  /** Short line above the title: section name or category. */
  eyebrow?: string;
  title: string;
  /** Language of the title when it differs from the page. */
  titleLang?: string;
  /** Id of the h1, for an aria-labelledby around the page. */
  titleId?: string;
  /** Lead paragraph under the title (plain text). */
  lead?: string | null;
  /** A cover or figure beside the text from the large breakpoint. */
  aside?: ReactNode;
  /** Dates, counts and links under the lead. */
  children?: ReactNode;
};

/**
 * Opening block of a publication page, in the same rhythm as the district
 * directory and the contact pages: breadcrumb, eyebrow with the signal rule,
 * the page's only h1, lead and meta. Text stays within the reading measure;
 * an optional aside (a book cover) sits beside it on wide screens.
 */
export default function PageIntro({
  locale,
  breadcrumb,
  eyebrow,
  title,
  titleLang,
  titleId,
  lead,
  aside,
  children,
}: PageIntroProps) {
  return (
    <Container as="header" className="pt-6 pb-10 sm:pb-14">
      <Breadcrumb items={breadcrumb} locale={locale} />
      <div
        className={cx(
          "mt-8 sm:mt-10",
          aside !== undefined &&
            aside !== null &&
            "grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,24rem)] lg:items-start lg:gap-16",
        )}
      >
        <div className="flex min-w-0 flex-col gap-5">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h1
            id={titleId}
            lang={titleLang}
            className="m-0 max-w-[22ch] type-display break-words hyphens-auto"
          >
            {title}
          </h1>
          {lead ? (
            <p className="m-0 max-w-measure type-lead text-ink">{lead}</p>
          ) : null}
          {children}
        </div>
        {aside}
      </div>
    </Container>
  );
}
