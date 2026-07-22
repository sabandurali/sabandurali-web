import {
  BOOK_CATEGORIES,
  BOOK_QUOTE_WARNING_LENGTH,
  BOOK_RATING,
  BOOK_REVIEW_LANGUAGES,
  BOOK_REVIEW_SEO_DESCRIPTION_RECOMMENDED_LENGTH,
  BOOK_REVIEW_TRANSLATION_STATUSES,
  READING_STATUSES,
  REVIEW_STATUSES,
} from "@/content/books/constants";
import {
  createBookReviewSlug,
  isValidIsbn10,
  isValidIsbn13,
} from "@/content/books/helpers";
import type {
  BookReview,
  BookReviewValidationResult,
} from "@/content/books/types";
import type { ValidationIssue } from "@/content/articles/types";

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function issue(code: string, path: string, message: string): ValidationIssue {
  return { code, path, message };
}

function hasValue(value: string | null): value is string {
  return value !== null && value.trim().length > 0;
}

function validatePublicationRequirements(
  bookReview: BookReview,
  errors: ValidationIssue[],
): void {
  if (isBlank(bookReview.title)) {
    errors.push(issue("title.required", "title", "Başlık zorunludur."));
  }

  if (isBlank(bookReview.slug)) {
    errors.push(issue("slug.required", "slug", "Slug zorunludur."));
  }

  if (bookReview.authors.length === 0) {
    errors.push(
      issue("authors.required", "authors", "En az bir kitap yazarı zorunludur."),
    );
  }

  if (isBlank(bookReview.summary)) {
    errors.push(issue("summary.required", "summary", "Özet zorunludur."));
  }

  if (bookReview.category === null) {
    errors.push(
      issue("category.required", "category", "Ana kategori zorunludur."),
    );
  }

  if (bookReview.coverImage === null) {
    errors.push(
      issue("cover_image.required", "coverImage", "Kapak görseli zorunludur."),
    );
  } else if (isBlank(bookReview.coverImage.alt)) {
    errors.push(
      issue(
        "cover_image.alt_required",
        "coverImage.alt",
        "Kapak görseli alternatif metni zorunludur.",
      ),
    );
  }

  if (isBlank(bookReview.personalEvaluation)) {
    errors.push(
      issue(
        "personal_evaluation.required",
        "personalEvaluation",
        "Kişisel değerlendirme zorunludur.",
      ),
    );
  }

  if (bookReview.rating === null) {
    errors.push(issue("rating.required", "rating", "Puan zorunludur."));
  }

  if (isBlank(bookReview.seo.title)) {
    errors.push(
      issue("seo.title_required", "seo.title", "SEO başlığı zorunludur."),
    );
  }

  if (isBlank(bookReview.seo.description)) {
    errors.push(
      issue(
        "seo.description_required",
        "seo.description",
        "SEO açıklaması zorunludur.",
      ),
    );
  }

  if (bookReview.publishedAt === null) {
    errors.push(
      issue(
        "published_at.required",
        "publishedAt",
        "Yayınlanmış incelemenin yayın tarihi olmalıdır.",
      ),
    );
  }
}

function validateReadingDates(
  bookReview: BookReview,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  if (
    bookReview.readingStatus === "completed" &&
    bookReview.completedAt === null
  ) {
    errors.push(
      issue(
        "reading.completed_at_required",
        "completedAt",
        "Tamamlanan kitap için bitirme tarihi zorunludur.",
      ),
    );
  }

  if (
    (bookReview.readingStatus === "planned" ||
      bookReview.readingStatus === "abandoned") &&
    bookReview.completedAt !== null
  ) {
    errors.push(
      issue(
        "reading.completed_at_forbidden",
        "completedAt",
        "Planlanan veya bırakılan kitapta bitirme tarihi bulunmamalıdır.",
      ),
    );
  }

  if (
    (bookReview.readingStatus === "reading" ||
      bookReview.readingStatus === "completed") &&
    bookReview.startedAt === null
  ) {
    warnings.push(
      issue(
        "reading.started_at_recommended",
        "startedAt",
        "Okunmakta veya tamamlanmış kitap için başlangıç tarihi önerilir.",
      ),
    );
  }

  if (bookReview.startedAt !== null && bookReview.completedAt !== null) {
    const startedAt = Date.parse(bookReview.startedAt);
    const completedAt = Date.parse(bookReview.completedAt);

    if (
      Number.isFinite(startedAt) &&
      Number.isFinite(completedAt) &&
      startedAt > completedAt
    ) {
      errors.push(
        issue(
          "reading.date_order",
          "completedAt",
          "Bitirme tarihi başlangıç tarihinden önce olamaz.",
        ),
      );
    }
  }
}

function validateRating(
  rating: number | null,
  errors: ValidationIssue[],
): void {
  if (rating === null) {
    return;
  }

  if (
    !Number.isFinite(rating) ||
    rating < BOOK_RATING.min ||
    rating > BOOK_RATING.max
  ) {
    errors.push(
      issue(
        "rating.range",
        "rating",
        `Puan ${BOOK_RATING.min} ile ${BOOK_RATING.max} arasında olmalıdır.`,
      ),
    );
  }

  if (!Number.isInteger(rating * 10)) {
    errors.push(
      issue(
        "rating.precision",
        "rating",
        "Puan en fazla bir ondalık basamak içerebilir.",
      ),
    );
  }
}

function validateIsbn(
  bookReview: BookReview,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  const target = bookReview.reviewStatus === "published" ? errors : warnings;

  if (hasValue(bookReview.isbn10) && !isValidIsbn10(bookReview.isbn10)) {
    target.push(issue("isbn10.invalid", "isbn10", "ISBN-10 geçersizdir."));
  }

  if (hasValue(bookReview.isbn13) && !isValidIsbn13(bookReview.isbn13)) {
    target.push(issue("isbn13.invalid", "isbn13", "ISBN-13 geçersizdir."));
  }
}

function collectContentWarnings(bookReview: BookReview): ValidationIssue[] {
  const warnings: ValidationIssue[] = [];
  const descriptionLength = bookReview.seo.description.trim().length;

  if (bookReview.keyIdeas.length === 0) {
    warnings.push(
      issue("key_ideas.recommended", "keyIdeas", "En az bir temel fikir önerilir."),
    );
  }

  if (bookReview.strengths.length === 0) {
    warnings.push(
      issue("strengths.recommended", "strengths", "Güçlü yön eklenmesi önerilir."),
    );
  }

  if (bookReview.weaknesses.length === 0) {
    warnings.push(
      issue("weaknesses.recommended", "weaknesses", "Zayıf yön eklenmesi önerilir."),
    );
  }

  if (bookReview.applicationNotes.length === 0) {
    warnings.push(
      issue(
        "application_notes.recommended",
        "applicationNotes",
        "En az bir uygulama notu önerilir.",
      ),
    );
  }

  if (
    descriptionLength > 0 &&
    (descriptionLength < BOOK_REVIEW_SEO_DESCRIPTION_RECOMMENDED_LENGTH.min ||
      descriptionLength > BOOK_REVIEW_SEO_DESCRIPTION_RECOMMENDED_LENGTH.max)
  ) {
    warnings.push(
      issue(
        "seo.description_length",
        "seo.description",
        `SEO açıklaması için önerilen uzunluk ${BOOK_REVIEW_SEO_DESCRIPTION_RECOMMENDED_LENGTH.min}–${BOOK_REVIEW_SEO_DESCRIPTION_RECOMMENDED_LENGTH.max} karakterdir.`,
      ),
    );
  }

  for (const quote of bookReview.quotes) {
    if (quote.text.length > BOOK_QUOTE_WARNING_LENGTH) {
      warnings.push(
        issue(
          "quotes.text_length",
          `quotes.${quote.id}.text`,
          `Alıntı ${BOOK_QUOTE_WARNING_LENGTH} karakterden uzundur.`,
        ),
      );
    }
  }

  return warnings;
}

export function validateBookReview(
  bookReview: BookReview,
): BookReviewValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings = collectContentWarnings(bookReview);

  if (!BOOK_REVIEW_LANGUAGES.includes(bookReview.language)) {
    errors.push(
      issue("language.invalid", "language", "Desteklenen bir dil seçilmelidir."),
    );
  }

  if (!BOOK_REVIEW_TRANSLATION_STATUSES.includes(bookReview.translationStatus)) {
    errors.push(
      issue(
        "translation_status.invalid",
        "translationStatus",
        "Desteklenen bir çeviri durumu seçilmelidir.",
      ),
    );
  }

  if (!READING_STATUSES.includes(bookReview.readingStatus)) {
    errors.push(
      issue(
        "reading_status.invalid",
        "readingStatus",
        "Desteklenen bir okuma durumu seçilmelidir.",
      ),
    );
  }

  if (!REVIEW_STATUSES.includes(bookReview.reviewStatus)) {
    errors.push(
      issue(
        "review_status.invalid",
        "reviewStatus",
        "Desteklenen bir inceleme durumu seçilmelidir.",
      ),
    );
  }

  if (
    bookReview.category !== null &&
    !BOOK_CATEGORIES.includes(bookReview.category)
  ) {
    errors.push(
      issue("category.invalid", "category", "Desteklenen bir kategori seçilmelidir."),
    );
  }

  if (
    bookReview.slug !== "" &&
    bookReview.slug !== createBookReviewSlug(bookReview.slug)
  ) {
    errors.push(
      issue(
        "slug.invalid",
        "slug",
        "Slug küçük harf, sayı ve tek tirelerden oluşmalıdır.",
      ),
    );
  }

  if (
    bookReview.authors.some(
      (author) => isBlank(author.id) || isBlank(author.name) || isBlank(author.slug),
    )
  ) {
    errors.push(
      issue(
        "authors.invalid",
        "authors",
        "Kitap yazarlarının id, ad ve slug alanları dolu olmalıdır.",
      ),
    );
  }

  for (const quote of bookReview.quotes) {
    if (isBlank(quote.text)) {
      errors.push(
        issue(
          "quotes.text_required",
          `quotes.${quote.id}.text`,
          "Alıntı metni boş olamaz.",
        ),
      );
    }
  }

  validateRating(bookReview.rating, errors);
  validateReadingDates(bookReview, errors, warnings);
  validateIsbn(bookReview, errors, warnings);

  if (bookReview.reviewStatus === "published") {
    validatePublicationRequirements(bookReview, errors);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
