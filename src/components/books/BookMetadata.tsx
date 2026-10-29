import MetaList, { type MetaItem } from "@/components/pages/MetaList";
import {
  type BookPageContent,
  formatBookReviewDate,
} from "@/content/books/book-page-content";
import { BOOK_CATEGORY_LABELS } from "@/content/books/constants";
import type { BookReview } from "@/content/books/types";
import { toDateTimeAttribute } from "@/lib/format-date";

type BookMetadataProps = {
  bookReview: BookReview;
  content: BookPageContent;
  className?: string;
};

type Entry = {
  label: string;
  value: string | null;
  /** Numbers, codes and dates are set in the data face. */
  data?: boolean;
  /** Source date for a <time> element. */
  date?: string | null;
};

/** Book facts that are present, in reading order; empty values are left out. */
export function getBookMetadataItems(
  bookReview: BookReview,
  content: BookPageContent,
): MetaItem[] {
  const year = (value: number | null) =>
    value === null ? null : String(value);
  const date = (value: string | null): Entry["value"] =>
    formatBookReviewDate(value, content);
  const entries: Entry[] = [
    {
      label: content.authorsLabel,
      value:
        bookReview.authors.length === 0
          ? null
          : bookReview.authors.map((author) => author.name).join(", "),
    },
    { label: content.originalTitleLabel, value: bookReview.originalTitle },
    { label: content.translatorLabel, value: bookReview.translator },
    { label: content.publisherLabel, value: bookReview.publisher },
    {
      label: content.originalPublisherLabel,
      value: bookReview.originalPublisher,
    },
    {
      label: content.publicationYearLabel,
      value: year(bookReview.publicationYear),
      data: true,
    },
    {
      label: content.originalPublicationYearLabel,
      value: year(bookReview.originalPublicationYear),
      data: true,
    },
    { label: content.editionLabel, value: bookReview.edition },
    {
      label: content.pageCountLabel,
      value: year(bookReview.pageCount),
      data: true,
    },
    { label: content.isbn10Label, value: bookReview.isbn10, data: true },
    { label: content.isbn13Label, value: bookReview.isbn13, data: true },
    {
      label: content.categoryLabel,
      value:
        bookReview.category === null
          ? null
          : BOOK_CATEGORY_LABELS[bookReview.category][bookReview.language],
    },
    {
      label: content.ratingLabel,
      value: bookReview.rating === null ? null : `${bookReview.rating} / 10`,
      data: true,
    },
    {
      label: content.readingStatusLabel,
      value: content.readingStatusLabels[bookReview.readingStatus],
    },
    {
      label: content.startedLabel,
      value: date(bookReview.startedAt),
      data: true,
      date: bookReview.startedAt,
    },
    {
      label: content.completedLabel,
      value: date(bookReview.completedAt),
      data: true,
      date: bookReview.completedAt,
    },
    {
      label: content.publishedLabel,
      value: date(bookReview.publishedAt),
      data: true,
      date: bookReview.publishedAt,
    },
  ];

  return entries.flatMap((entry) =>
    entry.value === null || entry.value.trim() === ""
      ? []
      : [
          {
            label: entry.label,
            value: entry.value,
            data: entry.data,
            dateTime:
              entry.date === undefined
                ? undefined
                : toDateTimeAttribute(entry.date),
          },
        ],
  );
}

/** The book's fact sheet: a list on a land panel, one column beside the review on wide screens. */
export default function BookMetadata({
  bookReview,
  content,
  className,
}: BookMetadataProps) {
  const items = getBookMetadataItems(bookReview, content);
  if (items.length === 0) return null;

  return (
    <div className={className}>
      <MetaList
        items={items}
        layout="sidebar"
        className="rounded-card border border-ink bg-land p-5 sm:p-6"
      />
    </div>
  );
}
