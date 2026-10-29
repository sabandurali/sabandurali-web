import ArticleCard from "@/components/articles/ArticleCard";
import BookReviewCard from "@/components/books/BookReviewCard";
import PhotoCard from "@/components/photos/PhotoCard";
import { cx } from "@/components/ui/cx";
import { articlePageContent } from "@/content/articles/article-page-content";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import { bookPageContent } from "@/content/books/book-page-content";
import type { PublicBookReview } from "@/content/books/public-types";
import type { PublicPhoto } from "@/content/photos/types";
import type { SiteLocale } from "@/lib/metadata";

/**
 * Card grids for publications shown outside their own list pages (the home
 * page, the workspace section pages). They use the list pages' cards, so
 * image checks, alt-text `lang`, credits, date style and cue are the same
 * everywhere. A section heading (`h2`) sits above them: card titles are `h3`.
 */
const gridClassName = "m-0 grid list-none gap-5 p-0 md:grid-cols-2";

export function ArticleCardList({
  articles,
  locale,
}: {
  articles: readonly PublicArticleSummary[];
  locale: SiteLocale;
}) {
  return (
    <ul className={cx(gridClassName, "xl:grid-cols-3")}>
      {articles.map((article) => (
        <li key={article.id} className="grid min-w-0">
          <ArticleCard
            article={article}
            content={articlePageContent[locale]}
            headingLevel="h3"
            compact
          />
        </li>
      ))}
    </ul>
  );
}

export function BookReviewCardList({
  books,
  locale,
}: {
  books: readonly PublicBookReview[];
  locale: SiteLocale;
}) {
  return (
    <ul className={cx(gridClassName, "xl:grid-cols-3")}>
      {books.map((book) => (
        <li key={book.id} className="grid min-w-0">
          <BookReviewCard
            bookReview={book}
            content={bookPageContent[locale]}
            headingLevel="h3"
          />
        </li>
      ))}
    </ul>
  );
}

export function PhotoCardList({
  photos,
  columns = 3,
}: {
  photos: readonly PublicPhoto[];
  /** Columns from 1280 px up: 4 on the home page's photo strip. */
  columns?: 3 | 4;
}) {
  return (
    <ul
      className={cx(
        gridClassName,
        columns === 4 ? "sm:grid-cols-2 xl:grid-cols-4" : "xl:grid-cols-3",
      )}
    >
      {photos.map((photo) => (
        <li key={photo.id} className="grid min-w-0">
          <PhotoCard photo={photo} headingLevel="h3" />
        </li>
      ))}
    </ul>
  );
}
