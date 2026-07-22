import Image from "next/image";
import Link from "next/link";
import { getAvailableLocalBookImage } from "@/content/books/book-images";
import {
  type BookPageContent,
  formatBookReviewDate,
} from "@/content/books/book-page-content";
import { getBookReviewPath } from "@/content/books/book-routes";
import { BOOK_CATEGORY_LABELS } from "@/content/books/constants";
import type { BookReview } from "@/content/books/types";

type BookReviewCardProps = {
  bookReview: BookReview;
  content: BookPageContent;
};

export default function BookReviewCard({
  bookReview,
  content,
}: BookReviewCardProps) {
  const coverImage = getAvailableLocalBookImage(bookReview.coverImage?.src);
  const category =
    bookReview.category === null
      ? content.categoryFallback
      : BOOK_CATEGORY_LABELS[bookReview.category][bookReview.language];
  const completedAt = formatBookReviewDate(bookReview.completedAt, content);
  const publishedAt = formatBookReviewDate(bookReview.publishedAt, content);
  const href = getBookReviewPath(bookReview.slug, bookReview.language);

  return (
    <article className="group overflow-hidden rounded-sm border border-border bg-surface/75 transition-colors hover:border-[var(--accent-border-hover)] motion-reduce:transition-none">
      {coverImage !== null && bookReview.coverImage !== null && (
        <Image
          src={coverImage}
          alt={bookReview.coverImage.alt}
          width={bookReview.coverImage.width}
          height={bookReview.coverImage.height}
          sizes="(min-width: 1024px) 360px, 100vw"
          className="aspect-[2/3] max-h-[32rem] w-full object-cover"
        />
      )}
      <div className="p-6 sm:p-7">
        <p className="text-xs font-semibold tracking-[0.16em] text-accent-soft uppercase">
          {category}
        </p>
        <h2 className="mt-3 text-2xl leading-tight text-ivory sm:text-3xl">
          <Link
            href={href}
            aria-label={`${content.readReview}: ${bookReview.title}`}
            className="transition-colors group-hover:text-accent-strong motion-reduce:transition-none"
          >
            {bookReview.title}
          </Link>
        </h2>
        {bookReview.originalTitle !== null && (
          <p className="mt-2 text-sm italic text-muted">
            {content.originalTitleLabel}: {bookReview.originalTitle}
          </p>
        )}
        {bookReview.authors.length > 0 && (
          <p className="mt-4 text-sm text-ivory">
            <span className="font-semibold">{content.authorsLabel}:</span>{" "}
            {bookReview.authors.map((author) => author.name).join(", ")}
          </p>
        )}
        <p className="mt-4 text-sm leading-7 text-muted sm:text-base">
          {bookReview.summary}
        </p>
        <dl className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
          <div className="flex gap-1.5">
            <dt className="font-semibold text-ivory">
              {content.readingStatusLabel}:
            </dt>
            <dd>{content.readingStatusLabels[bookReview.readingStatus]}</dd>
          </div>
          {bookReview.rating !== null && (
            <div className="flex gap-1.5">
              <dt className="font-semibold text-ivory">
                {content.ratingLabel}:
              </dt>
              <dd>{bookReview.rating} / 10</dd>
            </div>
          )}
          {completedAt !== null && (
            <div className="flex gap-1.5">
              <dt className="font-semibold text-ivory">
                {content.completedLabel}:
              </dt>
              <dd>{completedAt}</dd>
            </div>
          )}
          {publishedAt !== null && (
            <div className="flex gap-1.5">
              <dt className="font-semibold text-ivory">
                {content.publishedLabel}:
              </dt>
              <dd>{publishedAt}</dd>
            </div>
          )}
        </dl>
        <Link
          href={href}
          className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-accent-strong underline decoration-border underline-offset-4 transition-colors hover:text-ivory motion-reduce:transition-none"
        >
          {content.readReview} →
        </Link>
      </div>
    </article>
  );
}
