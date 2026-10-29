import { cardGrids } from "@/components/pages/card-grid";
import BookReviewCard from "@/components/books/BookReviewCard";
import PageIntro from "@/components/ui/PageIntro";
import PublicationShell from "@/components/pages/PublicationShell";
import { publicationCopy } from "@/components/pages/publication-copy";
import EmptyState from "@/components/ui/EmptyState";
import Section from "@/components/ui/Section";
import { bookPageContent } from "@/content/books/book-page-content";
import { bookListPaths } from "@/content/books/book-routes";
import type { PublicBookReviewSummary } from "@/content/books/public-types";
import type { BookReviewLanguage } from "@/content/books/types";

type BookReviewListPageProps = {
  bookReviews: ReadonlyArray<PublicBookReviewSummary>;
  locale: BookReviewLanguage;
};

/**
 * Book review list: intro with the review count, then every published
 * review as a card grid on the band ground. Prerendered whole, like the
 * article list.
 */
export default function BookReviewListPage({
  bookReviews,
  locale,
}: BookReviewListPageProps) {
  const content = bookPageContent[locale];
  const copy = publicationCopy[locale];

  return (
    <PublicationShell locale={locale} languageHrefs={bookListPaths}>
      <PageIntro
        layout="page"
        locale={locale}
        breadcrumb={[
          { label: copy.home, href: copy.homePath },
          { label: content.listTitle },
        ]}
        eyebrow={content.listEyebrow}
        title={content.listTitle}
        lead={content.listDescription}
      >
        {bookReviews.length > 0 ? (
          <p className="m-0 type-data-md text-ink-muted">
            {copy.bookCount(bookReviews.length)}
          </p>
        ) : null}
      </PageIntro>

      <Section
        tone="band"
        spacing="compact"
        divider
        labelledBy="book-list-heading"
      >
        <h2 id="book-list-heading" className="m-0 mb-6 type-h2">
          {copy.allBooks}
        </h2>
        {bookReviews.length === 0 ? (
          <EmptyState size="lg">{content.emptyList}</EmptyState>
        ) : (
          <ul className={cardGrids[3].className}>
            {bookReviews.map((bookReview) => (
              <li key={bookReview.id} className="grid">
                <BookReviewCard
                  bookReview={bookReview}
                  content={content}
                  headingLevel="h3"
                />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </PublicationShell>
  );
}
