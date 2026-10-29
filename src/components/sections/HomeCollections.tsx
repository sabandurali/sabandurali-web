import Image from "next/image";
import Card from "@/components/ui/Card";
import { Credit } from "@/components/ui/Figure";
import { getAvailablePublicArticleImage } from "@/content/articles/article-images";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import { getArticlePath } from "@/content/articles/article-routes";
import { getAvailableLocalBookImage } from "@/content/books/book-images";
import { getBookReviewPath } from "@/content/books/book-routes";
import type { BookReview } from "@/content/books/types";
import { getImageCredit } from "@/content/media";
import { getPhotoPath } from "@/content/photos/photo-routes";
import type { PublicPhoto } from "@/content/photos/types";
import { formatDate, toDateTimeAttribute } from "@/lib/format-date";
import type { SiteLocale } from "@/lib/metadata";
import { excerpt } from "./home-selection";

const gridClassName =
  "m-0 grid list-none gap-5 p-0 md:grid-cols-2 xl:grid-cols-3";

function PublishedDate({
  value,
  locale,
}: {
  value: string | null;
  locale: SiteLocale;
}) {
  const label = formatDate(value, locale, "long");
  const dateTime = toDateTimeAttribute(value);
  if (label === null || dateTime === null) return null;

  return (
    <time dateTime={dateTime} className="type-data-md">
      {label}
    </time>
  );
}

export function HomeArticleList({
  articles,
  locale,
}: {
  articles: readonly PublicArticleSummary[];
  locale: SiteLocale;
}) {
  return (
    <ul className={gridClassName}>
      {articles.map((article) => {
        const image = article.featuredImage;
        const src = getAvailablePublicArticleImage(image);
        const category = article.categories[0]?.name;

        return (
          <li key={article.id} className="flex min-w-0">
            <Card
              className="w-full"
              title={article.title}
              href={getArticlePath(article.slug, article.language)}
              media={
                image !== null && src !== null ? (
                  <Image
                    src={src}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
                    className="object-cover"
                  />
                ) : undefined
              }
              credit={
                image !== null && src !== null && image.credit ? (
                  <Credit
                    locale={locale}
                    credit={{ collection: image.credit }}
                  />
                ) : undefined
              }
              eyebrow={
                <>
                  <PublishedDate value={article.publishedAt} locale={locale} />
                  {category ? <span>{category}</span> : null}
                </>
              }
            >
              {article.summary.trim() !== "" ? (
                <p className="m-0 type-small text-ink-muted">
                  {excerpt(article.summary, 180)}
                </p>
              ) : null}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

export function HomeBookList({
  books,
  locale,
}: {
  books: readonly BookReview[];
  locale: SiteLocale;
}) {
  return (
    <ul className={gridClassName}>
      {books.map((book) => {
        const cover = book.coverImage;
        const src =
          cover === null ? null : getAvailableLocalBookImage(cover.src);
        const credit = cover === null ? null : getImageCredit(cover);
        const authors = book.authors.map((author) => author.name).join(", ");

        return (
          <li key={book.id} className="flex min-w-0">
            <Card
              className="w-full"
              title={book.title}
              href={getBookReviewPath(book.slug, book.language)}
              media={
                cover !== null && src !== null ? (
                  <Image
                    src={src}
                    alt={cover.alt}
                    fill
                    sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
                    className="object-contain p-3"
                  />
                ) : undefined
              }
              credit={
                src !== null && credit !== null ? (
                  <Credit locale={locale} credit={{ collection: credit }} />
                ) : undefined
              }
              eyebrow={
                authors !== "" || book.publicationYear !== null ? (
                  <>
                    {authors !== "" ? <span>{authors}</span> : null}
                    {book.publicationYear !== null ? (
                      <span className="type-data-md">
                        {book.publicationYear}
                      </span>
                    ) : null}
                  </>
                ) : undefined
              }
            >
              {book.summary.trim() !== "" ? (
                <p className="m-0 type-small text-ink-muted">
                  {excerpt(book.summary, 180)}
                </p>
              ) : null}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

export function HomePhotoList({
  photos,
  locale,
}: {
  photos: readonly PublicPhoto[];
  locale: SiteLocale;
}) {
  return (
    <ul className="m-0 grid list-none gap-5 p-0 sm:grid-cols-2 xl:grid-cols-4">
      {photos.map((photo) => (
        <li key={photo.id} className="flex min-w-0">
          <Card
            className="w-full"
            title={photo.title}
            href={getPhotoPath(photo.slug, photo.language)}
            media={
              <Image
                src={photo.image.src}
                alt={photo.image.alt}
                fill
                sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 100vw"
                className="object-cover"
              />
            }
            credit={
              <Credit
                locale={locale}
                credit={{
                  author: photo.photographer,
                  ...(photo.creditLicense
                    ? { licence: photo.creditLicense }
                    : {}),
                }}
              />
            }
            eyebrow={
              photo.locationName ? <span>{photo.locationName}</span> : undefined
            }
          />
        </li>
      ))}
    </ul>
  );
}
