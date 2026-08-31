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
  headingLevel?: "h2" | "h3";
  featured?: boolean;
};

export default function BookReviewCard({
  bookReview,
  content,
  headingLevel = "h2",
  featured = false,
}: BookReviewCardProps) {
  const Heading = headingLevel;
  const coverImage = getAvailableLocalBookImage(bookReview.coverImage?.src);
  const category =
    bookReview.category === null
      ? content.categoryFallback
      : BOOK_CATEGORY_LABELS[bookReview.category][bookReview.language];
  const completedAt = formatBookReviewDate(bookReview.completedAt, content);
  const publishedAt = formatBookReviewDate(bookReview.publishedAt, content);
  const href = getBookReviewPath(bookReview.slug, bookReview.language);

  return (
    <article className={`group overflow-hidden border border-border bg-surface/75 transition-colors hover:border-[var(--accent-border-hover)] motion-reduce:transition-none ${featured ? "md:grid md:grid-cols-[minmax(13rem,0.7fr)_minmax(0,1.3fr)]" : ""}`}>
      {coverImage !== null && bookReview.coverImage !== null && (
        <Image
          src={coverImage}
          alt={bookReview.coverImage.alt}
          width={bookReview.coverImage.width}
          height={bookReview.coverImage.height}
          sizes={featured ? "(min-width: 768px) 35vw, 100vw" : "(min-width: 1024px) 360px, 100vw"}
          className={`w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none ${featured ? "aspect-[4/3] md:h-full md:max-h-none md:aspect-auto" : "aspect-[2/3] max-h-[32rem]"}`}
        />
      )}
      <div className={`p-6 sm:p-7 ${featured ? "md:flex md:flex-col md:justify-center md:p-9" : ""}`}>
        <p className="text-xs font-semibold tracking-[0.16em] text-accent-soft uppercase">
          {category}
        </p>
        <Heading className={`mt-3 leading-tight text-ivory ${featured ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"}`}>
          <Link
            href={href}
            aria-label={`${content.readReview}: ${bookReview.title}`}
            className="transition-colors group-hover:text-accent-strong motion-reduce:transition-none"
          >
            {bookReview.title}
          </Link>
        </Heading>
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
