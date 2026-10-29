import MetaList, { type MetaItem } from "@/components/pages/MetaList";
import {
  altLanguageAttribute,
  creditFromImage,
  PublicationImage,
} from "@/components/pages/publication-media";
import Card from "@/components/ui/Card";
import { Credit } from "@/components/ui/Figure";
import { getAvailableLocalBookImage } from "@/content/books/book-images";
import {
  type BookPageContent,
  formatBookReviewDate,
} from "@/content/books/book-page-content";
import { getBookReviewPath } from "@/content/books/book-routes";
import { BOOK_CATEGORY_LABELS } from "@/content/books/constants";
import type { PublicBookReview } from "@/content/books/public-types";
import { toDateTimeAttribute } from "@/lib/format-date";

type BookReviewCardProps = {
  bookReview: PublicBookReview;
  content: BookPageContent;
  headingLevel?: "h2" | "h3";
};

/** Rating, reading status and review date of a review card. */
export function getBookReviewCardFacts(
  bookReview: PublicBookReview,
  content: BookPageContent,
): MetaItem[] {
  const facts: MetaItem[] = [
    {
      label: content.readingStatusLabel,
      value: content.readingStatusLabels[bookReview.readingStatus],
    },
  ];
  if (bookReview.rating !== null) {
    facts.push({
      label: content.ratingLabel,
      value: `${bookReview.rating} / 10`,
      data: true,
    });
  }
  const publishedAt = formatBookReviewDate(bookReview.publishedAt, content);
  if (publishedAt !== null) {
    facts.push({
      label: content.publishedLabel,
      value: publishedAt,
      dateTime: toDateTimeAttribute(bookReview.publishedAt),
      data: true,
    });
  }
  return facts;
}

/**
 * One book review in a list: the cover (whole, on the band ground, with
 * its credit), category, title link, authors, summary and reading facts.
 * The title is the only link and the card's accessible name.
 */
export default function BookReviewCard({
  bookReview,
  content,
  headingLevel = "h2",
}: BookReviewCardProps) {
  const coverImage = getAvailableLocalBookImage(bookReview.coverImage?.src);
  const cover = coverImage === null ? null : bookReview.coverImage;
  const category =
    bookReview.category === null
      ? content.categoryFallback
      : BOOK_CATEGORY_LABELS[bookReview.category][bookReview.language];
  const credit = cover === null ? null : creditFromImage(cover);
  const authors = bookReview.authors.map((author) => author.name).join(", ");

  return (
    <Card
      title={bookReview.title}
      href={getBookReviewPath(bookReview.slug, bookReview.language)}
      headingLevel={headingLevel === "h2" ? 2 : 3}
      media={
        coverImage !== null && cover !== null ? (
          <PublicationImage
            src={coverImage}
            alt={cover.alt}
            {...altLanguageAttribute(cover.altLanguage, bookReview.language)}
            layout="fill"
            fit="contain"
            sizes="(min-width: 1280px) 420px, (min-width: 768px) 50vw, 100vw"
            className="p-4"
          />
        ) : undefined
      }
      credit={
        credit !== null ? (
          <Credit credit={credit} locale={bookReview.language} />
        ) : undefined
      }
      eyebrow={<span className="font-semibold text-ink">{category}</span>}
      cta={content.readReview}
    >
      {authors !== "" ? (
        <p className="m-0 type-small">
          <span className="font-semibold">{content.authorsLabel}:</span>{" "}
          {authors}
        </p>
      ) : null}
      <p className="m-0 line-clamp-4 type-small text-ink-muted">
        {bookReview.summary}
      </p>
      <MetaList
        items={getBookReviewCardFacts(bookReview, content)}
        className="mt-2"
      />
    </Card>
  );
}
