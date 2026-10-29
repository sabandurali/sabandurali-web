import type { ReactNode } from "react";
import BookMetadata from "@/components/books/BookMetadata";
import PageIntro from "@/components/ui/PageIntro";
import PublicationShell from "@/components/pages/PublicationShell";
import { publicationCopy } from "@/components/pages/publication-copy";
import {
  altLanguageAttribute,
  creditFromImage,
  PublicationImage,
} from "@/components/pages/publication-media";
import TranslationLink from "@/components/pages/TranslationLink";
import { Figure } from "@/components/ui/Figure";
import Section from "@/components/ui/Section";
import TextLink from "@/components/ui/TextLink";
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
import type { PublicBookReview } from "@/content/books/public-types";

type BookReviewDetailPageProps = {
  bookReview: PublicBookReview;
  translation: PublicBookReview | null;
};

function ReviewSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="mt-12 scroll-mt-24 border-t-2 border-ink pt-8 first:mt-0"
    >
      <h2 id={`${id}-heading`} className="m-0 type-h2">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function TextList({ items }: { items: ReadonlyArray<string> }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {items.map((item) => (
        <li key={item} className="flex gap-3 type-body">
          <span
            aria-hidden="true"
            className="mt-[0.6em] size-2 shrink-0 bg-ink"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function NumberedPanels({
  items,
}: {
  items: ReadonlyArray<{ id: string; title: string; body: ReactNode }>;
}) {
  return (
    <ol className="m-0 flex list-none flex-col gap-4 p-0">
      {items.map((item, index) => (
        <li
          key={item.id}
          className="grid gap-x-4 gap-y-2 rounded-card border border-ink bg-land p-5 sm:grid-cols-[3rem_minmax(0,1fr)] sm:p-6"
        >
          <span
            aria-hidden="true"
            className="type-data-lg font-bold text-ink-muted"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <h3 className="m-0 type-h4">{item.title}</h3>
            {item.body}
          </div>
        </li>
      ))}
    </ol>
  );
}

function ReviewBody({
  bookReview,
  content,
}: {
  bookReview: PublicBookReview;
  content: BookPageContent;
}) {
  const byOrder = <T extends { order: number }>(items: ReadonlyArray<T>) =>
    items.toSorted((left, right) => left.order - right.order);
  const lists = [
    {
      id: "book-strengths",
      title: content.strengthsTitle,
      items: bookReview.strengths,
    },
    {
      id: "book-weaknesses",
      title: content.weaknessesTitle,
      items: bookReview.weaknesses,
    },
    {
      id: "book-who-should-read",
      title: content.whoShouldReadTitle,
      items: bookReview.whoShouldRead,
    },
    {
      id: "book-who-should-not-read",
      title: content.whoShouldNotReadTitle,
      items: bookReview.whoShouldNotRead,
    },
  ].filter((list) => list.items.length > 0);

  return (
    <>
      {bookReview.keyIdeas.length > 0 ? (
        <ReviewSection id="book-key-ideas" title={content.keyIdeasTitle}>
          <NumberedPanels
            items={byOrder(bookReview.keyIdeas).map((idea) => ({
              id: idea.id,
              title: idea.title,
              body: <p className="mt-2 mb-0 type-body">{idea.description}</p>,
            }))}
          />
        </ReviewSection>
      ) : null}

      {lists.map((list) => (
        <ReviewSection key={list.id} id={list.id} title={list.title}>
          <TextList items={list.items} />
        </ReviewSection>
      ))}

      {bookReview.applicationNotes.length > 0 ? (
        <ReviewSection
          id="book-application-notes"
          title={content.applicationNotesTitle}
        >
          <NumberedPanels
            items={byOrder(bookReview.applicationNotes).map((note) => ({
              id: note.id,
              title: note.title,
              body: (
                <>
                  <p className="mt-2 mb-0 type-body">{note.description}</p>
                  <p className="mt-4 mb-0 border-l-4 border-signal pl-4 type-small">
                    <span className="font-bold">{content.actionLabel}:</span>{" "}
                    {note.action}
                  </p>
                </>
              ),
            }))}
          />
        </ReviewSection>
      ) : null}

      {bookReview.personalEvaluation.trim() !== "" ? (
        <ReviewSection
          id="book-personal-evaluation"
          title={content.personalEvaluationTitle}
        >
          <p className="m-0 type-body">{bookReview.personalEvaluation}</p>
        </ReviewSection>
      ) : null}

      {bookReview.quotes.length > 0 ? (
        <ReviewSection id="book-quotes" title={content.quotesTitle}>
          <div className="flex flex-col gap-8">
            {byOrder(bookReview.quotes).map((quote) => (
              <figure key={quote.id} className="m-0">
                <blockquote className="m-0 border-l-4 border-ink pl-5 type-lead font-medium">
                  <p className="m-0">“{quote.text}”</p>
                </blockquote>
                {quote.page !== undefined || quote.note !== undefined ? (
                  <figcaption className="mt-3 flex flex-col gap-1 pl-6 type-small text-ink-muted">
                    {quote.page !== undefined ? (
                      <span>
                        {content.quotePageLabel}:{" "}
                        <span className="type-data-md">{quote.page}</span>
                      </span>
                    ) : null}
                    {quote.note !== undefined ? (
                      <span>
                        {content.quoteNoteLabel}: {quote.note}
                      </span>
                    ) : null}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </ReviewSection>
      ) : null}
    </>
  );
}

/**
 * Book review page: intro with the cover beside it on wide screens, the
 * book's fact sheet, then the review sections in the reading column.
 */
export default function BookReviewDetailPage({
  bookReview,
  translation,
}: BookReviewDetailPageProps) {
  const locale = bookReview.language;
  const content = bookPageContent[locale];
  const copy = publicationCopy[locale];
  const category =
    bookReview.category === null
      ? content.categoryFallback
      : BOOK_CATEGORY_LABELS[bookReview.category][locale];
  const coverImage = getAvailableLocalBookImage(bookReview.coverImage?.src);
  const cover = coverImage === null ? null : bookReview.coverImage;

  return (
    <PublicationShell
      locale={locale}
      languageHrefs={getBookReviewLanguagePaths(bookReview, translation)}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeBookReviewJsonLd(bookReview),
        }}
      />
      <article aria-labelledby="book-title">
        <PageIntro
          layout="page"
          locale={locale}
          breadcrumb={[
            { label: copy.home, href: copy.homePath },
            { label: content.listTitle, href: bookListPaths[locale] },
            { label: bookReview.title },
          ]}
          eyebrow={category}
          title={bookReview.title}
          titleId="book-title"
          lead={bookReview.summary}
          aside={
            coverImage !== null && cover !== null ? (
              <Figure
                caption={cover.caption}
                credit={creditFromImage(cover)}
                locale={locale}
                className="max-w-[20rem] lg:max-w-none"
              >
                <PublicationImage
                  src={coverImage}
                  alt={cover.alt}
                  {...altLanguageAttribute(cover.altLanguage, locale)}
                  width={cover.width}
                  height={cover.height}
                  sizes="(min-width: 1024px) 384px, 320px"
                  preload
                  className="rounded-card border border-ink"
                />
              </Figure>
            ) : undefined
          }
        >
          {translation !== null ? (
            <TranslationLink
              href={getBookReviewPath(translation.slug, translation.language)}
              targetLanguage={translation.language}
              label={content.translationLabel}
              labelLanguage={locale === "tr" ? "en" : undefined}
            />
          ) : null}
        </PageIntro>

        <Section
          tone="paper"
          spacing="none"
          divider
          className="pt-10 pb-section sm:pt-14"
        >
          <div className="grid gap-12 lg:grid-cols-[minmax(0,66ch)_minmax(16rem,1fr)] lg:items-start lg:gap-16">
            <div className="min-w-0 lg:order-2">
              <BookMetadata
                bookReview={bookReview}
                content={content}
                className="lg:sticky lg:top-6"
              />
            </div>
            <div className="min-w-0 lg:order-1">
              <ReviewBody bookReview={bookReview} content={content} />
              <TextLink
                href={bookListPaths[locale]}
                variant="standalone"
                locale={locale}
                className="mt-12"
              >
                {content.backToBooks}
              </TextLink>
            </div>
          </div>
        </Section>
      </article>
    </PublicationShell>
  );
}
