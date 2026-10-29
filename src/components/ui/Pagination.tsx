import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { cx } from "./cx";
import { clampPaginationPage, getPaginationEntries } from "./pagination-entries";
import { getUiStrings, type UiLocale } from "./strings";
import UiLink from "./UiLink";
import VisuallyHidden from "./VisuallyHidden";

type PaginationProps = {
  current: number;
  total: number;
  /** URL of a page, e.g. (page) => page === 1 ? "/makaleler" : `/makaleler?sayfa=${page}`. */
  getHref: (page: number) => string;
  siblings?: number;
  locale?: UiLocale;
  className?: string;
};

const cellClassName =
  "inline-flex min-h-tap min-w-tap items-center justify-center rounded-control px-2 font-mono text-small font-semibold [font-stretch:var(--stretch-mono)]";

const stepClassName =
  "inline-flex min-h-tap items-center gap-1.5 rounded-control px-3 font-bold text-ink no-underline hover:underline";

/** Page links for long lists; renders nothing for a single page. */
export default function Pagination({
  current,
  total,
  getHref,
  siblings = 1,
  locale = "tr",
  className,
}: PaginationProps) {
  const entries = getPaginationEntries(current, total, siblings);
  if (entries.length <= 1) return null;
  const strings = getUiStrings(locale);
  const page = clampPaginationPage(current, total);
  const pageCount = Math.floor(total);

  return (
    <nav aria-label={strings.pagination} className={className}>
      <ul className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        {page > 1 ? (
          <li>
            <UiLink
              href={getHref(page - 1)}
              rel="prev"
              className={stepClassName}
            >
              <ChevronLeftIcon size={18} />
              <span className="sr-only sm:not-sr-only">
                {strings.previousPage}
              </span>
            </UiLink>
          </li>
        ) : null}
        {entries.map((entry) =>
          entry.type === "gap" ? (
            <li
              key={entry.key}
              aria-hidden="true"
              className="px-1 text-ink-muted"
            >
              …
            </li>
          ) : (
            <li key={entry.page}>
              <UiLink
                href={getHref(entry.page)}
                aria-current={entry.page === page ? "page" : undefined}
                className={cx(
                  cellClassName,
                  entry.page === page
                    ? "bg-sea text-on-sea no-underline"
                    : "border border-tile-edge text-ink no-underline hover:border-ink hover:underline",
                )}
              >
                <VisuallyHidden>{strings.page(entry.page)}</VisuallyHidden>
                <span aria-hidden="true">{entry.page}</span>
              </UiLink>
            </li>
          ),
        )}
        {page < pageCount ? (
          <li>
            <UiLink
              href={getHref(page + 1)}
              rel="next"
              className={stepClassName}
            >
              <span className="sr-only sm:not-sr-only">{strings.nextPage}</span>
              <ChevronRightIcon size={18} />
            </UiLink>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
