import {
  exampleEnglishBookReview,
  exampleTurkishBookReview,
} from "@/content/books/examples";
import { BookReviewQueryService } from "@/content/books/repository/book-review-query-service";
import { InMemoryBookReviewRepository } from "@/content/books/repository/in-memory-book-review-repository";

export async function getBookReviewRepositoryExamples() {
  // These records are model fixtures. The fixed clock keeps this example
  // deterministic and does not assert that the review is live on a route.
  const repository = new InMemoryBookReviewRepository([
    exampleTurkishBookReview,
    exampleEnglishBookReview,
  ]);
  const queryService = new BookReviewQueryService(
    repository,
    () => new Date("2026-07-23T00:00:00+03:00"),
  );

  const turkishBookReview = await queryService.getPublishedBookReview(
    exampleTurkishBookReview.slug,
    "tr",
  );
  const publishedBookReviews = await queryService.getPublishedBookReviews({
    language: "tr",
  });
  const learningBookReviews = await queryService.getBookReviewsByCategory(
    "learning_and_education",
    "tr",
  );
  const highlyRatedBookReviews = await queryService.getPublishedBookReviews({
    language: "tr",
    minimumRating: 8,
    maximumRating: 10,
  });
  const authorBookReviews = await queryService.getBookReviewsByAuthor(
    exampleTurkishBookReview.authors[0].id,
    "tr",
  );
  // The fixture intentionally has no unverified ISBN, so this lookup is null.
  const isbnBookReview = await queryService.findBookReviewByIsbn(
    exampleTurkishBookReview.isbn13 ?? "",
    "tr",
  );
  const englishTranslation = await queryService.getBookReviewTranslation(
    exampleTurkishBookReview.id,
    "en",
  );
  const featuredBookReviews = await queryService.getFeaturedBookReviews(
    "tr",
    3,
  );

  return {
    turkishBookReview,
    publishedBookReviews,
    learningBookReviews,
    highlyRatedBookReviews,
    authorBookReviews,
    isbnBookReview,
    englishTranslation,
    featuredBookReviews,
  };
}
