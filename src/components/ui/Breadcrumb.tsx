import { cx } from "./cx";
import { getUiStrings, type UiLocale } from "./strings";
import UiLink from "./UiLink";

export type BreadcrumbItem = {
  label: string;
  /** Omit for the current page (always the last item). */
  href?: string;
};

type BreadcrumbProps = {
  items: readonly BreadcrumbItem[];
  locale?: UiLocale;
  className?: string;
};

/** "Konum" trail. The last item is the current page (aria-current). */
export default function Breadcrumb({
  items,
  locale = "tr",
  className,
}: BreadcrumbProps) {
  if (items.length === 0) return null;
  const strings = getUiStrings(locale);

  return (
    <nav aria-label={strings.breadcrumb} className={className}>
      <ol className="m-0 flex list-none flex-wrap items-center gap-x-2.5 p-0 type-small text-ink-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={`${index}-${item.label}`}
              className="flex items-center gap-2.5"
            >
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cx("text-ink", isLast && "font-bold")}
                >
                  {item.label}
                </span>
              ) : (
                <UiLink
                  href={item.href}
                  className="-mx-1 inline-flex min-h-tap items-center px-1 text-ink underline decoration-1 underline-offset-[0.2em] hover:decoration-2"
                >
                  {item.label}
                </UiLink>
              )}
              {isLast ? null : <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
