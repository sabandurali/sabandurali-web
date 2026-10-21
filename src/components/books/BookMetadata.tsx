import {
  type BookPageContent,
  formatBookReviewDate,
} from "@/content/books/book-page-content";
import { BOOK_CATEGORY_LABELS } from "@/content/books/constants";
import type { BookReview } from "@/content/books/types";

type BookMetadataProps = {
  bookReview: BookReview;
  content: BookPageContent;
};

type MetadataEntry = {
  label: string;
  value: string | null;
};

export default function BookMetadata({
  bookReview,
  content,
}: BookMetadataProps) {
  const category =
    bookReview.category === null
      ? null
      : BOOK_CATEGORY_LABELS[bookReview.category][bookReview.language];
  const entries: ReadonlyArray<MetadataEntry> = [
    {
      label: content.authorsLabel,
      value:
        bookReview.authors.length === 0
          ? null
          : bookReview.authors.map((author) => author.name).join(", "),
    },
    { label: content.translatorLabel, value: bookReview.translator },
    { label: content.publisherLabel, value: bookReview.publisher },
    {
      label: content.originalPublisherLabel,
      value: bookReview.originalPublisher,
    },
    {
      label: content.publicationYearLabel,
      value:
        bookReview.publicationYear === null
          ? null
          : String(bookReview.publicationYear),
    },
    {
      label: content.originalPublicationYearLabel,
      value:
        bookReview.originalPublicationYear === null
          ? null
          : String(bookReview.originalPublicationYear),
    },
    { label: content.editionLabel, value: bookReview.edition },
    {
      label: content.pageCountLabel,
      value:
        bookReview.pageCount === null ? null : String(bookReview.pageCount),
    },
    { label: content.isbn10Label, value: bookReview.isbn10 },
    { label: content.isbn13Label, value: bookReview.isbn13 },
    { label: content.categoryLabel, value: category },
    {
      label: content.ratingLabel,
      value:
        bookReview.rating === null ? null : `${bookReview.rating} / 10`,
    },
    {
      label: content.readingStatusLabel,
      value: content.readingStatusLabels[bookReview.readingStatus],
    },
    {
      label: content.startedLabel,
      value: formatBookReviewDate(bookReview.startedAt, content),
    },
    {
      label: content.completedLabel,
      value: formatBookReviewDate(bookReview.completedAt, content),
    },
    {
      label: content.publishedLabel,
      value: formatBookReviewDate(bookReview.publishedAt, content),
    },
  ];
  const visibleEntries = entries.filter(
    (entry): entry is { label: string; value: string } =>
      entry.value !== null && entry.value.trim() !== "",
  );

  if (visibleEntries.length === 0) {
    return null;
  }

  return (
    <dl className="mt-8 grid gap-4 rounded-sm border border-border bg-surface/70 p-5 text-sm sm:grid-cols-2 sm:p-6">
      {visibleEntries.map((entry) => (
        <div key={entry.label} className="min-w-0">
          <dt className="font-semibold text-ivory">{entry.label}</dt>
          <dd className="mt-1 break-words text-muted">{entry.value}</dd>
        </div>
      ))}
    </dl>
  );
}
