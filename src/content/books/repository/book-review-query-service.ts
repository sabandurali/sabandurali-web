import {
  isPubliclyPublishedBookReview,
  type BookReviewRepository,
} from "@/content/books/repository/book-review-repository";
import type {
  BookReviewPagination,
  PaginatedBookReviewResult,
  PublishedBookReviewListQuery,
} from "@/content/books/repository/types";
import type {
  BookCategory,
  BookReview,
  BookReviewLanguage,
} from "@/content/books/types";

const MAX_CURATED_BOOK_REVIEW_LIMIT = 20;

function normalizeLimit(limit: number): number {
  if (!Number.isFinite(limit)) {
    return 0;
  }

  return Math.min(
    Math.max(Math.floor(limit), 0),
    MAX_CURATED_BOOK_REVIEW_LIMIT,
  );
}

export class BookReviewQueryService {
  constructor(
    private readonly repository: BookReviewRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getPublishedBookReview(
    slug: string,
    language: BookReviewLanguage,
  ): Promise<BookReview | null> {
    const bookReview = await this.repository.findBySlugAndLanguage(
      slug,
      language,
    );

    return bookReview !== null &&
      isPubliclyPublishedBookReview(bookReview, this.now())
      ? bookReview
      : null;
  }

  async getPublishedBookReviews(
    query: PublishedBookReviewListQuery = {},
  ): Promise<PaginatedBookReviewResult<BookReview>> {
    return this.repository.list({
      ...query,
      publishedOnly: true,
      publishedAsOf: this.now(),
    });
  }

  async getFeaturedBookReviews(
    language: BookReviewLanguage,
    limit: number,
  ): Promise<BookReview[]> {
    return this.getCuratedBookReviews(language, limit, "featured");
  }

  async getHomepageBookReviews(
    language: BookReviewLanguage,
    limit: number,
  ): Promise<BookReview[]> {
    return this.getCuratedBookReviews(language, limit, "showOnHomepage");
  }

  async getBookReviewTranslation(
    bookReviewId: string,
    targetLanguage: BookReviewLanguage,
  ): Promise<BookReview | null> {
    const translation = await this.repository.findTranslation(
      bookReviewId,
      targetLanguage,
    );

    return translation !== null &&
      isPubliclyPublishedBookReview(translation, this.now())
      ? translation
      : null;
  }

  async getBookReviewsByAuthor(
    authorId: string,
    language: BookReviewLanguage,
    pagination?: BookReviewPagination,
  ): Promise<PaginatedBookReviewResult<BookReview>> {
    return this.getPublishedBookReviews({
      language,
      authorIds: [authorId],
      pagination,
    });
  }

  async getBookReviewsByCategory(
    category: BookCategory,
    language: BookReviewLanguage,
    pagination?: BookReviewPagination,
  ): Promise<PaginatedBookReviewResult<BookReview>> {
    return this.getPublishedBookReviews({
      language,
      category,
      pagination,
    });
  }

  async findBookReviewByIsbn(
    isbn: string,
    language?: BookReviewLanguage,
  ): Promise<BookReview | null> {
    const bookReview = await this.repository.findByIsbn(isbn);

    if (
      bookReview === null ||
      (language !== undefined && bookReview.language !== language) ||
      !isPubliclyPublishedBookReview(bookReview, this.now())
    ) {
      return null;
    }

    return bookReview;
  }

  private async getCuratedBookReviews(
    language: BookReviewLanguage,
    limit: number,
    flag: "featured" | "showOnHomepage",
  ): Promise<BookReview[]> {
    const safeLimit = normalizeLimit(limit);

    if (safeLimit === 0) {
      return [];
    }

    const result = await this.getPublishedBookReviews({
      language,
      [flag]: true,
      pagination: { page: 1, pageSize: safeLimit },
    });

    return result.items;
  }
}
