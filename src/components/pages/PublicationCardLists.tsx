import ArticleCard from "@/components/articles/ArticleCard";
import BookReviewCard from "@/components/books/BookReviewCard";
import PhotoCard from "@/components/photos/PhotoCard";
import { cardGrids, type CardGridColumns } from "@/components/pages/card-grid";
import { articlePageContent } from "@/content/articles/article-page-content";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import { bookPageContent } from "@/content/books/book-page-content";
import type { PublicBookReviewSummary } from "@/content/books/public-types";
import type { PublicPhoto } from "@/content/photos/types";
import type { SiteLocale } from "@/lib/metadata";

/**
 * Card grids for publications shown outside their own list pages (the home
 * page, the workspace section pages). They use the list pages' cards, so
 * image checks, alt-text `lang`, credits, date style and cue are the same
 * everywhere. A section heading (`h2`) sits above them: card titles are `h3`.
 * The grids and image `sizes` come from `cardGrids`.
 */

export function ArticleCardList({
  articles,
  locale,
}: {
  articles: readonly PublicArticleSummary[];
  locale: SiteLocale;
}) {
  return (
    <ul className={cardGrids[3].className}>
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
  books: readonly PublicBookReviewSummary[];
  locale: SiteLocale;
}) {
  return (
    <ul className={cardGrids[3].className}>
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
  /**
   * Columns from 1280 px up: 4 on the home page's photo strip and the
   * related photographs of a photo page.
   */
  columns?: CardGridColumns;
}) {
  return (
    <ul className={cardGrids[columns].className}>
      {photos.map((photo) => (
        <li key={photo.id} className="grid min-w-0">
          <PhotoCard photo={photo} headingLevel="h3" columns={columns} />
        </li>
      ))}
    </ul>
  );
}
