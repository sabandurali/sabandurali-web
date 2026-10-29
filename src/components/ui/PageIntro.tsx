import type { ReactNode } from "react";
import Breadcrumb, { type BreadcrumbItem } from "./Breadcrumb";
import Container from "./Container";
import { cx } from "./cx";
import Eyebrow from "./Eyebrow";
import type { UiLocale } from "./strings";

type PageIntroProps = {
  /** Trail ending with the current page; omitted when empty. */
  breadcrumb?: readonly BreadcrumbItem[];
  /** Short label above the title ("İLETİŞİM", a category). */
  eyebrow?: string;
  title: string;
  /** Language of the title when it differs from the page. */
  titleLang?: string;
  /** Id of the h1, for an aria-labelledby around the page. */
  titleId?: string;
  /** Lead paragraph under the title. */
  lead?: ReactNode;
  locale?: UiLocale;
  /** `display` for landing pages, `h2-lg` for reading pages. */
  size?: "display" | "h2-lg";
  /**
   * `section`: inside a `Section` that provides the column (workspace,
   * about, contact and privacy pages). `page`: the opening of a
   * publication page, with its own `Container` and spacing.
   */
  layout?: "section" | "page";
  /** A cover or figure beside the text from the large breakpoint. */
  aside?: ReactNode;
  /** Dates, counts, links or notes under the lead. */
  children?: ReactNode;
  className?: string;
};

/**
 * Page opening: breadcrumb, eyebrow with the signal rule, the page's only
 * h1, the lead and optional meta. Every page uses this one component, so
 * the title style, hyphenation and spacing stay the same across pages.
 */
export default function PageIntro({
  breadcrumb,
  eyebrow,
  title,
  titleLang,
  titleId,
  lead,
  locale = "tr",
  size = "display",
  layout = "section",
  aside,
  children,
  className,
}: PageIntroProps) {
  const hasBreadcrumb = breadcrumb !== undefined && breadcrumb.length > 0;
  const hasAside = aside !== undefined && aside !== null;

  const text = (
    <div className="flex min-w-0 flex-col gap-5">
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h1
        id={titleId}
        lang={titleLang}
        className={cx(
          "m-0 max-w-[22ch] text-ink break-words hyphens-auto",
          size === "display" ? "type-display" : "type-h2-lg",
        )}
      >
        {title}
      </h1>
      {lead ? (
        <p className="m-0 max-w-measure type-lead text-ink">{lead}</p>
      ) : null}
      {children}
    </div>
  );

  const body = hasAside ? (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,24rem)] lg:items-start lg:gap-16">
      {text}
      {aside}
    </div>
  ) : (
    text
  );

  if (layout === "page") {
    return (
      <Container as="header" className={cx("pt-6 pb-10 sm:pb-14", className)}>
        {hasBreadcrumb ? (
          <Breadcrumb items={breadcrumb} locale={locale} />
        ) : null}
        <div className={hasBreadcrumb ? "mt-8 sm:mt-10" : undefined}>
          {body}
        </div>
      </Container>
    );
  }

  return (
    <header className={cx("flex flex-col gap-5", className)}>
      {hasBreadcrumb ? <Breadcrumb items={breadcrumb} locale={locale} /> : null}
      {body}
    </header>
  );
}
