import {
  BOOK_CATEGORIES,
  BOOK_REVIEW_TRANSLATION_STATUSES,
  READING_STATUSES,
  REVIEW_STATUSES,
} from "@/content/books/constants";
import { getSafePayloadMediaPath } from "@/content/media-paths";
import { validateBookReview } from "@/content/books/schema";
import type {
  BookCategory,
  BookReview,
  BookReviewLanguage,
  BookReviewTranslationStatus,
  ReadingStatus,
  ReviewStatus,
} from "@/content/books/types";
import { getText, isRecord } from "@/content/guards";

/**
 * Publication gate for book reviews.
 *
 * The public site shows a review only when it passes `validateBookReview`
 * (rating, category, author, sized cover image, reading dates, ISBN checksum,
 * ...) and is `reviewStatus: "published"` with `seo.index` on. Before this gate
 * the CMS accepted reviews that failed those rules: they looked published in
 * the admin and silently never appeared. Publishing now runs the same rules
 * and reports every problem on its field.
 *
 * `_status` (Payload's draft/publish) and `reviewStatus` work together:
 * publishing requires `reviewStatus` "published" (shown on the site) or
 * "archived" (deliberately kept off the site). "draft", "in_review" and
 * "scheduled" belong to unpublished drafts; schedule with a future
 * `publishedAt` instead.
 */

export type PublicationIssue = Readonly<{ message: string; path: string }>;

const PUBLISHABLE_REVIEW_STATUSES: ReadonlySet<string> = new Set([
  "archived",
  "published",
]);

function getNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getPositiveNumber(value: unknown): number | null {
  const number = getNumber(value);
  return number !== null && number > 0 ? number : null;
}

function oneOf<TValue extends string>(
  values: readonly TValue[],
  value: unknown,
  fallback: TValue,
): TValue {
  return values.find((candidate) => candidate === value) ?? fallback;
}

function getCategory(value: unknown): BookCategory | null {
  return BOOK_CATEGORIES.find((category) => category === value) ?? null;
}

function rows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function textRows(value: unknown): string[] {
  return rows(value).flatMap((row) => {
    const text = getText(row.value);
    return text === null ? [] : [text];
  });
}

/**
 * A cover image the public mapper accepts: an image with known dimensions
 * served from a safe media path.
 */
export function isPublishableCoverImage(media: unknown): boolean {
  return (
    isRecord(media) &&
    (getText(media.mimeType)?.startsWith("image/") ?? false) &&
    getSafePayloadMediaPath(media.url) !== null &&
    getPositiveNumber(media.width) !== null &&
    getPositiveNumber(media.height) !== null
  );
}

/**
 * The review as the public site would see it, built from the merged CMS
 * document. `coverMedia` is the referenced Media document, if any.
 */
export function toBookReviewCandidate(
  book: Record<string, unknown>,
  coverMedia: unknown,
): BookReview {
  const id = getText(book.id) ?? "new";
  const title = getText(book.title) ?? "";
  const seo = isRecord(book.seo) ? book.seo : {};
  const media = isRecord(coverMedia) ? coverMedia : {};
  const coverSrc = getSafePayloadMediaPath(media.url);
  const coverWidth = getPositiveNumber(media.width);
  const coverHeight = getPositiveNumber(media.height);
  const cover =
    isPublishableCoverImage(coverMedia) &&
    coverSrc !== null &&
    coverWidth !== null &&
    coverHeight !== null
      ? {
          src: coverSrc,
          alt: getText(book.coverImageAlt) ?? getText(media.alt) ?? title,
          width: coverWidth,
          height: coverHeight,
        }
      : null;

  return {
    id,
    title,
    slug: getText(book.slug) ?? "",
    language: oneOf<BookReviewLanguage>(["tr", "en"], book.language, "tr"),
    translationGroupId: null,
    translationStatus: oneOf<BookReviewTranslationStatus>(
      BOOK_REVIEW_TRANSLATION_STATUSES,
      book.translationStatus,
      BOOK_REVIEW_TRANSLATION_STATUSES[0],
    ),
    originalTitle: getText(book.originalTitle),
    authors: rows(book.authors).flatMap((author, index) => {
      const name = getText(author.name);
      const slug = getText(author.slug);

      return name === null || slug === null
        ? []
        : [
            {
              id: getText(author.id) ?? `${id}-author-${index + 1}`,
              name,
              slug,
            },
          ];
    }),
    translator: getText(book.translator),
    publisher: getText(book.publisher),
    originalPublisher: getText(book.originalPublisher),
    publicationYear: getNumber(book.publicationYear),
    originalPublicationYear: getNumber(book.originalPublicationYear),
    edition: getText(book.edition),
    isbn10: getText(book.isbn10),
    isbn13: getText(book.isbn13),
    pageCount: getNumber(book.pageCount),
    coverImage: cover,
    category: getCategory(book.category),
    tags: [],
    readingStatus: oneOf<ReadingStatus>(
      READING_STATUSES,
      book.readingStatus,
      "planned",
    ),
    reviewStatus: oneOf<ReviewStatus>(
      REVIEW_STATUSES,
      book.reviewStatus,
      "draft",
    ),
    startedAt: getText(book.startedAt),
    completedAt: getText(book.completedAt),
    summary: getText(book.summary) ?? "",
    keyIdeas: rows(book.keyIdeas).map((idea, index) => ({
      id: getText(idea.id) ?? `${id}-idea-${index + 1}`,
      title: getText(idea.title) ?? "",
      description: getText(idea.description) ?? "",
      order: getNumber(idea.order) ?? index,
    })),
    strengths: textRows(book.strengths),
    weaknesses: textRows(book.weaknesses),
    whoShouldRead: textRows(book.whoShouldRead),
    whoShouldNotRead: textRows(book.whoShouldNotRead),
    applicationNotes: rows(book.applicationNotes).map((note, index) => ({
      id: getText(note.id) ?? `${id}-note-${index + 1}`,
      title: getText(note.title) ?? "",
      description: getText(note.description) ?? "",
      action: getText(note.action) ?? "",
      order: getNumber(note.order) ?? index,
    })),
    personalEvaluation: getText(book.personalEvaluation) ?? "",
    rating: getNumber(book.rating),
    quotes: rows(book.quotes).map((quote, index) => ({
      id: getText(quote.id) ?? `${id}-quote-${index + 1}`,
      text: getText(quote.text) ?? "",
      order: getNumber(quote.order) ?? index,
    })),
    relatedBookIds: [],
    authorId: null,
    editorId: null,
    featured: book.featured === true,
    showOnHomepage: book.showOnHomepage === true,
    seo: {
      title: getText(seo.title) ?? "",
      description: getText(seo.description) ?? "",
      index: seo.index === true,
      follow: seo.follow !== false,
    },
    createdAt: getText(book.createdAt) ?? new Date(0).toISOString(),
    updatedAt: getText(book.updatedAt) ?? new Date(0).toISOString(),
    publishedAt: getText(book.publishedAt),
  };
}

/** Maps a `validateBookReview` path to the CMS field that holds the value. */
function toFieldPath(path: string): string {
  if (path === "coverImage.alt") return "coverImageAlt";
  if (path.startsWith("quotes.")) return "quotes";

  return path;
}

/**
 * Problems that keep a book review off the public site although it is being
 * published. Empty for drafts, for archived reviews and for valid reviews.
 */
export function getBookPublicationIssues(
  book: Record<string, unknown>,
  coverMedia: unknown,
): PublicationIssue[] {
  if (book._status !== "published") return [];

  const reviewStatus = getText(book.reviewStatus);

  if (reviewStatus === null || !PUBLISHABLE_REVIEW_STATUSES.has(reviewStatus)) {
    return [
      {
        message:
          "Yayınlamak için İnceleme durumunu 'published' yapın. Sitede gizli kalacaksa 'archived' seçin; ileri tarihli yayın için Yayın tarihini kullanın.",
        path: "reviewStatus",
      },
    ];
  }

  if (reviewStatus === "archived") return [];

  const issues: PublicationIssue[] = [];
  const seo = isRecord(book.seo) ? book.seo : {};

  if (seo.index !== true) {
    issues.push({
      message:
        "Yayındaki inceleme yalnız 'Arama motorlarında indeksle' açıkken sitede görünür. İndekslemeyi açın veya İnceleme durumunu 'archived' yapın.",
      path: "seo.index",
    });
  }

  // A selected cover that the site cannot show (a PDF, or an image without
  // stored dimensions) deserves a clearer message than "cover required".
  const unusableCover =
    book.coverImage !== null &&
    book.coverImage !== undefined &&
    !isPublishableCoverImage(coverMedia);
  const validation = validateBookReview(
    toBookReviewCandidate(book, coverMedia),
  );

  for (const error of validation.errors) {
    issues.push(
      unusableCover && error.code === "cover_image.required"
        ? {
            message:
              "Kapak görseli genişlik ve yükseklik bilgisi olan bir görsel (JPEG, PNG, WebP veya GIF) olmalıdır.",
            path: "coverImage",
          }
        : { message: error.message, path: toFieldPath(error.path) },
    );
  }

  const seen = new Set<string>();

  return issues.filter((issue) => {
    const key = `${issue.path}:${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
