import { homeBreadcrumbItem } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import EmptyState from "@/components/ui/EmptyState";
import { Field, Input } from "@/components/ui/Field";
import PageIntro from "@/components/ui/PageIntro";
import UiLink from "@/components/ui/UiLink";
import PageShell from "@/components/workspaces/PageShell";
import type { SiteLocale } from "@/content/locales";
import { searchCopy } from "@/content/search/search-copy";
import { searchPaths, searchQueryParam } from "@/content/search/search-routes";
import {
  searchQueryMaxLength,
  type SearchDocument,
  type SearchResult,
  type SearchSourceName,
} from "@/content/search/site-search";

type SearchPageProps = {
  locale: SiteLocale;
  result: SearchResult;
  unavailable: readonly SearchSourceName[];
};

/** Summaries are shown as one short paragraph. */
const summaryMaxLength = 220;

function shorten(text: string): string {
  const value = text.replace(/\s+/g, " ").trim();
  if (value.length <= summaryMaxLength) return value;
  const cut = value.slice(0, summaryMaxLength - 1);
  const space = cut.lastIndexOf(" ");
  return `${space > 0 ? cut.slice(0, space) : cut}…`;
}

function ResultItem({
  document,
  locale,
}: {
  document: SearchDocument;
  locale: SiteLocale;
}) {
  const copy = searchCopy[locale];
  const foreign = document.language !== locale;

  return (
    <li className="border-t border-hairline py-4 first:border-t-0 first:pt-0">
      <UiLink
        href={document.path}
        lang={foreign ? document.language : undefined}
        hrefLang={foreign ? document.language : undefined}
        className="inline-flex min-h-tap items-center type-h4 text-ink underline decoration-1 underline-offset-[0.2em] hover:decoration-2"
      >
        {document.title}
      </UiLink>
      {foreign ? (
        <span className="ml-2 type-caption text-ink-muted">
          ({copy.inTurkish})
        </span>
      ) : null}
      {document.summary === null ? null : (
        <p
          lang={foreign ? document.language : undefined}
          className="m-0 mt-1 max-w-measure type-small text-ink-muted"
        >
          {shorten(document.summary)}
        </p>
      )}
    </li>
  );
}

/**
 * The site search page of both languages. The form is a plain GET form, so
 * it works without JavaScript and every result page has its own URL; the
 * results are rendered on the server.
 */
export default function SearchPage({
  locale,
  result,
  unavailable,
}: SearchPageProps) {
  const copy = searchCopy[locale];
  const hasQuery = result.terms.length > 0;

  return (
    <PageShell locale={locale} languageHrefs={searchPaths}>
      <main id="main" className="bg-paper text-ink scheme-light">
        <PageIntro
          layout="page"
          locale={locale}
          breadcrumb={[homeBreadcrumbItem(locale), { label: copy.crumb }]}
          eyebrow={copy.eyebrow}
          title={copy.title}
          lead={copy.lead}
        >
          <form
            role="search"
            method="get"
            action={searchPaths[locale]}
            className="flex max-w-[40rem] flex-col gap-4 sm:flex-row sm:items-end"
          >
            <Field
              label={copy.fieldLabel}
              hint={copy.fieldHint}
              locale={locale}
              className="min-w-0 flex-1"
            >
              {(control) => (
                <Input
                  {...control}
                  type="search"
                  name={searchQueryParam}
                  defaultValue={result.query}
                  maxLength={searchQueryMaxLength}
                  autoComplete="off"
                  enterKeyHint="search"
                />
              )}
            </Field>
            <Button type="submit" className="sm:self-end">
              {copy.submit}
            </Button>
          </form>
        </PageIntro>

        <Container className="pb-section">
          <div className="grid gap-10 border-t-2 border-ink pt-8">
            {unavailable.length > 0 ? (
              <p className="m-0 max-w-measure type-small font-semibold text-ink">
                {copy.unavailable(unavailable)}
              </p>
            ) : null}

            {!hasQuery ? (
              <p className="m-0 type-body text-ink-muted">{copy.emptyQuery}</p>
            ) : result.total === 0 ? (
              <EmptyState note={copy.noResultsNote}>
                {copy.noResults(result.query)}
              </EmptyState>
            ) : (
              <>
                <h2 className="m-0 type-h2">
                  {copy.resultsHeading(result.query, result.total)}
                </h2>
                {result.groups.map((group) => {
                  const headingId = `sonuc-${group.kind}`;
                  return (
                    <section
                      key={group.kind}
                      aria-labelledby={headingId}
                      className="grid gap-4"
                    >
                      <h3 id={headingId} className="m-0 type-h3">
                        {copy.groups[group.kind]}{" "}
                        <span className="type-data-md text-ink-muted">
                          ({group.results.length})
                        </span>
                      </h3>
                      <ul className="m-0 list-none p-0">
                        {group.results.map((document) => (
                          <ResultItem
                            key={document.path}
                            document={document}
                            locale={locale}
                          />
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </>
            )}
          </div>
        </Container>
      </main>
    </PageShell>
  );
}
