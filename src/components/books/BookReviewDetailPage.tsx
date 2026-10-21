import Image from "next/image";
import Link from "next/link";
import BookMetadata from "@/components/books/BookMetadata";
import BackToTop from "@/components/layout/BackToTop";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { getAvailableLocalBookImage } from "@/content/books/book-images";
import {
  type BookPageContent,
  bookPageContent,
} from "@/content/books/book-page-content";
import {
  bookListPaths,
  getBookReviewLanguagePaths,
  getBookReviewPath,
} from "@/content/books/book-routes";
import { serializeBookReviewJsonLd } from "@/content/books/book-seo";
import { BOOK_CATEGORY_LABELS } from "@/content/books/constants";
import type { BookReview } from "@/content/books/types";
import { homeContent } from "@/content/homeContent";

type BookReviewDetailPageProps = {
  bookReview: BookReview;
  translation: BookReview | null;
};

type TextListSectionProps = {
  id: string;
  title: string;
  items: ReadonlyArray<string>;
};

function TextListSection({ id, title, items }: TextListSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="mt-12 border-t border-border pt-9 sm:mt-14"
    >
      <h2 id={`${id}-heading`} className="text-3xl text-ivory">
        {title}
      </h2>
      <ul className="mt-6 space-y-3 text-base leading-7 text-muted">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span aria-hidden="true" className="text-accent-strong">
              •
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function KeyIdeas({
  bookReview,
  content,
}: {
  bookReview: BookReview;
  content: BookPageContent;
}) {
  if (bookReview.keyIdeas.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="book-key-ideas-heading"
      className="mt-12 border-t border-border pt-9 sm:mt-14"
    >
      <h2 id="book-key-ideas-heading" className="text-3xl text-ivory">
        {content.keyIdeasTitle}
      </h2>
      <ol className="mt-6 space-y-5">
        {bookReview.keyIdeas
          .toSorted((left, right) => left.order - right.order)
          .map((idea) => (
            <li
              key={idea.id}
              className="rounded-sm border border-border bg-surface/70 p-5 sm:p-6"
            >
              <h3 className="text-xl text-ivory">{idea.title}</h3>
              <p className="mt-3 leading-7 text-muted">{idea.description}</p>
            </li>
          ))}
      </ol>
    </section>
  );
}

function ApplicationNotes({
  bookReview,
  content,
}: {
  bookReview: BookReview;
  content: BookPageContent;
}) {
  if (bookReview.applicationNotes.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="book-application-notes-heading"
      className="mt-12 border-t border-border pt-9 sm:mt-14"
    >
      <h2 id="book-application-notes-heading" className="text-3xl text-ivory">
        {content.applicationNotesTitle}
      </h2>
      <ol className="mt-6 space-y-5">
        {bookReview.applicationNotes
          .toSorted((left, right) => left.order - right.order)
          .map((note) => (
            <li
              key={note.id}
              className="rounded-sm border border-border bg-surface/70 p-5 sm:p-6"
            >
              <h3 className="text-xl text-ivory">{note.title}</h3>
              <p className="mt-3 leading-7 text-muted">{note.description}</p>
              <p className="mt-4 border-l-2 border-accent pl-4 text-sm leading-7 text-accent-soft">
                <span className="font-semibold">{content.actionLabel}:</span>{" "}
                {note.action}
              </p>
            </li>
          ))}
      </ol>
    </section>
  );
}

function Quotes({
  bookReview,
  content,
}: {
  bookReview: BookReview;
  content: BookPageContent;
}) {
  if (bookReview.quotes.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="book-quotes-heading"
      className="mt-12 border-t border-border pt-9 sm:mt-14"
    >
      <h2 id="book-quotes-heading" className="text-3xl text-ivory">
        {content.quotesTitle}
      </h2>
      <div className="mt-6 space-y-5">
        {bookReview.quotes
          .toSorted((left, right) => left.order - right.order)
          .map((quote) => (
            <blockquote
              key={quote.id}
              className="rounded-sm border border-border bg-surface/70 p-5 sm:p-6"
            >
              <p className="font-serif text-xl leading-8 text-ivory">
                “{quote.text}”
              </p>
              {(quote.page !== undefined || quote.note !== undefined) && (
                <footer className="mt-4 space-y-1 text-sm leading-6 text-muted">
                  {quote.page !== undefined && (
                    <p>
                      {content.quotePageLabel}: {quote.page}
                    </p>
                  )}
                  {quote.note !== undefined && (
                    <p>
                      {content.quoteNoteLabel}: {quote.note}
                    </p>
                  )}
                </footer>
              )}
            </blockquote>
          ))}
      </div>
    </section>
  );
}

export default function BookReviewDetailPage({
  bookReview,
  translation,
}: BookReviewDetailPageProps) {
  const content = bookPageContent[bookReview.language];
  const home = homeContent[bookReview.language];
  const homePath = bookReview.language === "tr" ? "/" : "/en";
  const category =
    bookReview.category === null
      ? content.categoryFallback
      : BOOK_CATEGORY_LABELS[bookReview.category][bookReview.language];
  const coverImage = getAvailableLocalBookImage(bookReview.coverImage?.src);

  return (
    <div id="top" lang={bookReview.language}>
      <Header
        locale={bookReview.language}
        anchors={home.anchors}
        content={home.header}
        homeHref={homePath}
        anchorPrefix={homePath}
        languageHrefs={getBookReviewLanguagePaths(bookReview, translation)}
      />
      <main className="px-4 py-10 sm:px-6 sm:py-14 lg:py-18">
        <article className="mx-auto max-w-4xl">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: serializeBookReviewJsonLd(bookReview),
            }}
          />

          <nav aria-label={content.backToBooks} className="mb-8">
            <Link
              href={bookListPaths[bookReview.language]}
              className="inline-flex min-h-11 items-center text-sm text-accent-soft underline decoration-border underline-offset-4 hover:text-accent-strong"
            >
              ← {content.backToBooks}
            </Link>
          </nav>

          <header className="border-b border-border pb-9 sm:pb-12">
            <p className="text-xs font-semibold tracking-[0.18em] text-accent-soft uppercase">
              {category}
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl leading-[1.08] text-ivory sm:text-5xl lg:text-6xl">
              {bookReview.title}
            </h1>
            {bookReview.originalTitle !== null && (
              <p className="mt-4 text-base italic text-muted sm:text-lg">
                {content.originalTitleLabel}: {bookReview.originalTitle}
              </p>
            )}
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted sm:text-xl sm:leading-9">
              {bookReview.summary}
            </p>

            <BookMetadata bookReview={bookReview} content={content} />

            {translation !== null && (
              <Link
                href={getBookReviewPath(
                  translation.slug,
                  translation.language,
                )}
                aria-label={content.translationAriaLabel}
                className="mt-7 inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold text-accent-strong transition-colors hover:border-accent hover:text-ivory"
              >
                {content.translationLabel} →
              </Link>
            )}
          </header>

          {coverImage !== null && bookReview.coverImage !== null && (
            <figure className="mx-auto mt-10 max-w-md sm:mt-12">
              <Image
                src={coverImage}
                alt={bookReview.coverImage.alt}
                width={bookReview.coverImage.width}
                height={bookReview.coverImage.height}
                sizes="(min-width: 640px) 448px, 100vw"
                priority
                className="h-auto w-full rounded-sm border border-border object-cover"
              />
              {bookReview.coverImage.caption && (
                <figcaption className="mt-3 text-sm text-muted">
                  {bookReview.coverImage.caption}
                </figcaption>
              )}
            </figure>
          )}

          <div className="mx-auto mt-10 max-w-3xl sm:mt-14">
            <KeyIdeas bookReview={bookReview} content={content} />
            <TextListSection
              id="book-strengths"
              title={content.strengthsTitle}
              items={bookReview.strengths}
            />
            <TextListSection
              id="book-weaknesses"
              title={content.weaknessesTitle}
              items={bookReview.weaknesses}
            />
            <TextListSection
              id="book-who-should-read"
              title={content.whoShouldReadTitle}
              items={bookReview.whoShouldRead}
            />
            <TextListSection
              id="book-who-should-not-read"
              title={content.whoShouldNotReadTitle}
              items={bookReview.whoShouldNotRead}
            />
            <ApplicationNotes bookReview={bookReview} content={content} />

            {bookReview.personalEvaluation.trim() !== "" && (
              <section
                aria-labelledby="book-personal-evaluation-heading"
                className="mt-12 border-t border-border pt-9 sm:mt-14"
              >
                <h2
                  id="book-personal-evaluation-heading"
                  className="text-3xl text-ivory"
                >
                  {content.personalEvaluationTitle}
                </h2>
                <p className="mt-5 text-base leading-8 text-muted sm:text-lg">
                  {bookReview.personalEvaluation}
                </p>
              </section>
            )}

            <Quotes bookReview={bookReview} content={content} />
          </div>
        </article>
      </main>
      <Footer id={home.anchors.contact} content={home.footer} />
      <BackToTop label={home.backToTopLabel} />
    </div>
  );
}
