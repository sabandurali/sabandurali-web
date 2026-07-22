"use client";

import { useState, type FormEvent } from "react";
import {
  BOOK_READING_STATUS_LABELS,
  BOOK_REVIEW_STATUS_LABELS,
} from "@/components/admin/books/book-admin-labels";
import {
  INITIAL_BOOK_REVIEW_FORM_STATE,
  mapBookReviewFormStateToBookReview,
  type BookReviewFormState,
} from "@/components/admin/books/book-review-form";
import BookReviewValidationResult from "@/components/admin/books/BookReviewValidationResult";
import {
  BOOK_CATEGORIES,
  BOOK_CATEGORY_LABELS,
  READING_STATUSES,
  REVIEW_STATUSES,
} from "@/content/books/constants";
import { createBookReviewSlug, normalizeIsbn } from "@/content/books/helpers";
import { validateBookReview } from "@/content/books/schema";
import type {
  BookReview,
  BookReviewValidationResult as ValidationResult,
} from "@/content/books/types";
import type { ValidationIssue } from "@/content/articles/types";

type Submission = {
  bookReview: BookReview;
  validation: ValidationResult;
};

const fieldClassName =
  "mt-2 min-h-11 w-full rounded-sm border border-border bg-background px-4 py-3 text-base text-ivory outline-none transition-colors placeholder:text-muted-dark hover:border-accent focus:border-accent motion-reduce:transition-none";
const fieldsetClassName =
  "rounded-sm border border-border bg-surface/70 p-5 sm:p-6";

function RequiredLabel({ optional = false }: { optional?: boolean }) {
  return (
    <span className="ml-2 text-xs font-normal text-accent-soft">
      {optional ? "Opsiyonel" : "Zorunlu"}
    </span>
  );
}

function FieldErrors({
  id,
  issues,
}: {
  id: string;
  issues: ReadonlyArray<ValidationIssue>;
}) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <ul id={id} className="mt-2 space-y-1 text-sm text-accent-soft">
      {issues.map((issue) => (
        <li key={`${issue.code}-${issue.path}`}>{issue.message}</li>
      ))}
    </ul>
  );
}

export default function BookReviewFormPrototype() {
  const [form, setForm] = useState<BookReviewFormState>(
    INITIAL_BOOK_REVIEW_FORM_STATE,
  );
  const [slugWasEdited, setSlugWasEdited] = useState(false);
  const [authorSlugWasEdited, setAuthorSlugWasEdited] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);

  function updateField<Key extends keyof BookReviewFormState>(
    field: Key,
    value: BookReviewFormState[Key],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setSubmission(null);
  }

  function getErrors(paths: ReadonlyArray<string>): ReadonlyArray<ValidationIssue> {
    return (
      submission?.validation.errors.filter((issue) =>
        paths.includes(issue.path),
      ) ?? []
    );
  }

  function handleTitleChange(title: string) {
    setForm((current) => ({
      ...current,
      title,
      slug: slugWasEdited ? current.slug : createBookReviewSlug(title),
    }));
    setSubmission(null);
  }

  function handleAuthorNameChange(authorName: string) {
    setForm((current) => ({
      ...current,
      authorName,
      authorSlug: authorSlugWasEdited
        ? current.authorSlug
        : createBookReviewSlug(authorName),
    }));
    setSubmission(null);
  }

  function handleReadingStatusChange(
    readingStatus: BookReviewFormState["readingStatus"],
  ) {
    setForm((current) => ({
      ...current,
      readingStatus,
      completedAt:
        readingStatus === "planned" || readingStatus === "abandoned"
          ? ""
          : current.completedAt,
    }));
    setSubmission(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const bookReview = mapBookReviewFormStateToBookReview(form);
    setSubmission({
      bookReview,
      validation: validateBookReview(bookReview),
    });
  }

  const titleErrors = getErrors(["title"]);
  const slugErrors = getErrors(["slug"]);
  const authorErrors = getErrors(["authors"]);
  const categoryErrors = getErrors(["category"]);
  const readingStatusErrors = getErrors(["readingStatus"]);
  const reviewStatusErrors = getErrors(["reviewStatus", "publishedAt"]);
  const startedAtErrors = getErrors(["startedAt"]);
  const completedAtErrors = getErrors(["completedAt"]);
  const isbn10Errors = getErrors(["isbn10"]);
  const isbn13Errors = getErrors(["isbn13"]);
  const coverErrors = getErrors(["coverImage"]);
  const coverAltErrors = getErrors(["coverImage.alt"]);
  const summaryErrors = getErrors(["summary"]);
  const keyIdeaErrors = getErrors(["keyIdeas"]);
  const personalEvaluationErrors = getErrors(["personalEvaluation"]);
  const ratingErrors = getErrors(["rating"]);
  const seoTitleErrors = getErrors(["seo.title"]);
  const seoDescriptionErrors = getErrors(["seo.description"]);
  const completedAtDisabled =
    form.readingStatus === "planned" || form.readingStatus === "abandoned";

  return (
    <>
      <form noValidate onSubmit={handleSubmit} className="mt-8 space-y-6">
        <p className="rounded-sm border border-accent bg-surface px-5 py-4 text-sm leading-6 text-ivory">
          Bu geliştirme prototipi veriyi kaydetmez veya yayımlamaz. Gönderim
          yalnızca tarayıcı belleğinde geçici bir BookReview nesnesi ve
          doğrulama sonucu üretir.
        </p>

        <fieldset className={fieldsetClassName}>
          <legend className="px-2 text-2xl text-ivory">Temel bilgiler</legend>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="book-title" className="font-medium text-ivory">
                İnceleme başlığı
                <RequiredLabel />
              </label>
              <input
                id="book-title"
                name="title"
                type="text"
                required
                value={form.title}
                onChange={(event) => handleTitleChange(event.target.value)}
                aria-invalid={titleErrors.length > 0 || undefined}
                aria-describedby={titleErrors.length ? "book-title-errors" : undefined}
                className={fieldClassName}
              />
              <FieldErrors id="book-title-errors" issues={titleErrors} />
            </div>

            <div className="sm:col-span-2">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <label htmlFor="book-slug" className="font-medium text-ivory">
                  Slug
                  <RequiredLabel />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setSlugWasEdited(false);
                    updateField("slug", createBookReviewSlug(form.title));
                  }}
                  className="min-h-11 text-sm text-accent-soft underline decoration-border underline-offset-4 transition-colors hover:text-accent-strong motion-reduce:transition-none"
                >
                  Başlıktan yeniden oluştur
                </button>
              </div>
              <input
                id="book-slug"
                name="slug"
                type="text"
                required
                value={form.slug}
                onChange={(event) => {
                  setSlugWasEdited(true);
                  updateField("slug", event.target.value);
                }}
                aria-invalid={slugErrors.length > 0 || undefined}
                aria-describedby={slugErrors.length ? "book-slug-help book-slug-errors" : "book-slug-help"}
                className={fieldClassName}
              />
              <p id="book-slug-help" className="mt-2 text-xs leading-5 text-muted">
                Türkçe karakterler dönüştürülür. Elle düzenlenen değer, başlık
                değişince korunur.
              </p>
              <FieldErrors id="book-slug-errors" issues={slugErrors} />
            </div>

            <div>
              <label htmlFor="book-original-title" className="font-medium text-ivory">
                Özgün başlık
                <RequiredLabel optional />
              </label>
              <input
                id="book-original-title"
                name="originalTitle"
                type="text"
                value={form.originalTitle}
                onChange={(event) => updateField("originalTitle", event.target.value)}
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="book-author-name" className="font-medium text-ivory">
                Kitap yazarı
                <RequiredLabel />
              </label>
              <input
                id="book-author-name"
                name="authorName"
                type="text"
                required
                value={form.authorName}
                onChange={(event) => handleAuthorNameChange(event.target.value)}
                aria-invalid={authorErrors.length > 0 || undefined}
                aria-describedby={authorErrors.length ? "book-author-errors" : undefined}
                className={fieldClassName}
              />
              <FieldErrors id="book-author-errors" issues={authorErrors} />
            </div>

            <div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <label htmlFor="book-author-slug" className="font-medium text-ivory">
                  Yazar slug
                  <RequiredLabel />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAuthorSlugWasEdited(false);
                    updateField("authorSlug", createBookReviewSlug(form.authorName));
                  }}
                  className="min-h-11 text-sm text-accent-soft underline decoration-border underline-offset-4 hover:text-accent-strong"
                >
                  Yeniden oluştur
                </button>
              </div>
              <input
                id="book-author-slug"
                name="authorSlug"
                type="text"
                required
                value={form.authorSlug}
                onChange={(event) => {
                  setAuthorSlugWasEdited(true);
                  updateField("authorSlug", event.target.value);
                }}
                aria-invalid={authorErrors.length > 0 || undefined}
                aria-describedby={authorErrors.length ? "book-author-errors" : undefined}
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="book-translator" className="font-medium text-ivory">
                Çevirmen
                <RequiredLabel optional />
              </label>
              <input
                id="book-translator"
                name="translator"
                type="text"
                value={form.translator}
                onChange={(event) => updateField("translator", event.target.value)}
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="book-publisher" className="font-medium text-ivory">
                Yayınevi
                <RequiredLabel optional />
              </label>
              <input
                id="book-publisher"
                name="publisher"
                type="text"
                value={form.publisher}
                onChange={(event) => updateField("publisher", event.target.value)}
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="book-publication-year" className="font-medium text-ivory">
                Yayın yılı
                <RequiredLabel optional />
              </label>
              <input
                id="book-publication-year"
                name="publicationYear"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={form.publicationYear}
                onChange={(event) => updateField("publicationYear", event.target.value)}
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="book-page-count" className="font-medium text-ivory">
                Sayfa sayısı
                <RequiredLabel optional />
              </label>
              <input
                id="book-page-count"
                name="pageCount"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={form.pageCount}
                onChange={(event) => updateField("pageCount", event.target.value)}
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="book-isbn-10" className="font-medium text-ivory">
                ISBN-10
                <RequiredLabel optional />
              </label>
              <input
                id="book-isbn-10"
                name="isbn10"
                type="text"
                inputMode="text"
                value={form.isbn10}
                onChange={(event) => updateField("isbn10", event.target.value)}
                onBlur={() => updateField("isbn10", normalizeIsbn(form.isbn10))}
                aria-invalid={isbn10Errors.length > 0 || undefined}
                aria-describedby={isbn10Errors.length ? "book-isbn-10-errors" : undefined}
                className={fieldClassName}
              />
              <FieldErrors id="book-isbn-10-errors" issues={isbn10Errors} />
            </div>

            <div>
              <label htmlFor="book-isbn-13" className="font-medium text-ivory">
                ISBN-13
                <RequiredLabel optional />
              </label>
              <input
                id="book-isbn-13"
                name="isbn13"
                type="text"
                inputMode="numeric"
                value={form.isbn13}
                onChange={(event) => updateField("isbn13", event.target.value)}
                onBlur={() => updateField("isbn13", normalizeIsbn(form.isbn13))}
                aria-invalid={isbn13Errors.length > 0 || undefined}
                aria-describedby={isbn13Errors.length ? "book-isbn-13-errors" : undefined}
                className={fieldClassName}
              />
              <FieldErrors id="book-isbn-13-errors" issues={isbn13Errors} />
            </div>
          </div>
        </fieldset>

        <fieldset className={fieldsetClassName}>
          <legend className="px-2 text-2xl text-ivory">Sınıflandırma ve tarihler</legend>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="book-category" className="font-medium text-ivory">
                Kategori
                <RequiredLabel />
              </label>
              <select
                id="book-category"
                name="category"
                required
                value={form.category}
                onChange={(event) => updateField("category", event.target.value as BookReviewFormState["category"])}
                aria-invalid={categoryErrors.length > 0 || undefined}
                aria-describedby={categoryErrors.length ? "book-category-errors" : undefined}
                className={fieldClassName}
              >
                <option value="">Kategori seçin</option>
                {BOOK_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {BOOK_CATEGORY_LABELS[category].tr}
                  </option>
                ))}
              </select>
              <FieldErrors id="book-category-errors" issues={categoryErrors} />
            </div>

            <div>
              <label htmlFor="book-reading-status" className="font-medium text-ivory">
                Okuma durumu
                <RequiredLabel />
              </label>
              <select
                id="book-reading-status"
                name="readingStatus"
                value={form.readingStatus}
                onChange={(event) => handleReadingStatusChange(event.target.value as BookReviewFormState["readingStatus"])}
                aria-invalid={readingStatusErrors.length > 0 || undefined}
                aria-describedby={readingStatusErrors.length ? "book-reading-status-errors" : undefined}
                className={fieldClassName}
              >
                {READING_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {BOOK_READING_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <FieldErrors id="book-reading-status-errors" issues={readingStatusErrors} />
            </div>

            <div>
              <label htmlFor="book-review-status" className="font-medium text-ivory">
                İnceleme durumu
                <RequiredLabel />
              </label>
              <select
                id="book-review-status"
                name="reviewStatus"
                value={form.reviewStatus}
                onChange={(event) => updateField("reviewStatus", event.target.value as BookReviewFormState["reviewStatus"])}
                aria-invalid={reviewStatusErrors.length > 0 || undefined}
                aria-describedby={reviewStatusErrors.length ? "book-review-status-errors" : undefined}
                className={fieldClassName}
              >
                {REVIEW_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {BOOK_REVIEW_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <FieldErrors id="book-review-status-errors" issues={reviewStatusErrors} />
            </div>

            <div>
              <label htmlFor="book-started-at" className="font-medium text-ivory">
                Okumaya başlama tarihi
                <RequiredLabel optional />
              </label>
              <input
                id="book-started-at"
                name="startedAt"
                type="date"
                value={form.startedAt}
                onChange={(event) => updateField("startedAt", event.target.value)}
                aria-invalid={startedAtErrors.length > 0 || undefined}
                aria-describedby={startedAtErrors.length ? "book-started-at-errors" : undefined}
                className={fieldClassName}
              />
              <FieldErrors id="book-started-at-errors" issues={startedAtErrors} />
            </div>

            <div>
              <label htmlFor="book-completed-at" className="font-medium text-ivory">
                Tamamlama tarihi
                <RequiredLabel optional={form.readingStatus !== "completed"} />
              </label>
              <input
                id="book-completed-at"
                name="completedAt"
                type="date"
                disabled={completedAtDisabled}
                value={form.completedAt}
                onChange={(event) => updateField("completedAt", event.target.value)}
                aria-invalid={completedAtErrors.length > 0 || undefined}
                aria-describedby={completedAtErrors.length ? "book-completed-at-help book-completed-at-errors" : "book-completed-at-help"}
                className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-60`}
              />
              <p id="book-completed-at-help" className="mt-2 text-xs leading-5 text-muted">
                Tamamlandı durumunda zorunludur; planlandı veya yarım bırakıldı
                durumunda kullanılmaz.
              </p>
              <FieldErrors id="book-completed-at-errors" issues={completedAtErrors} />
            </div>
          </div>
        </fieldset>

        <fieldset className={fieldsetClassName}>
          <legend className="px-2 text-2xl text-ivory">Kapak görseli</legend>
          <p className="mt-3 text-sm leading-6 text-muted">
            Bu prototip dosya yüklemez; yalnızca mevcut bir görsel yolunu geçici
            nesneye aktarır.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="book-cover-src" className="font-medium text-ivory">
                Görsel yolu
                <RequiredLabel />
              </label>
              <input
                id="book-cover-src"
                name="coverImageSrc"
                type="text"
                value={form.coverImageSrc}
                onChange={(event) => updateField("coverImageSrc", event.target.value)}
                placeholder="/images/books/ornek.webp"
                aria-invalid={coverErrors.length > 0 || undefined}
                aria-describedby={coverErrors.length ? "book-cover-errors" : undefined}
                className={fieldClassName}
              />
              <FieldErrors id="book-cover-errors" issues={coverErrors} />
            </div>
            <div>
              <label htmlFor="book-cover-alt" className="font-medium text-ivory">
                Alternatif metin
                <RequiredLabel />
              </label>
              <input
                id="book-cover-alt"
                name="coverImageAlt"
                type="text"
                value={form.coverImageAlt}
                onChange={(event) => updateField("coverImageAlt", event.target.value)}
                aria-invalid={coverAltErrors.length > 0 || undefined}
                aria-describedby={coverAltErrors.length ? "book-cover-alt-errors" : undefined}
                className={fieldClassName}
              />
              <FieldErrors id="book-cover-alt-errors" issues={coverAltErrors} />
            </div>
          </div>
        </fieldset>

        <fieldset className={fieldsetClassName}>
          <legend className="px-2 text-2xl text-ivory">İnceleme içeriği</legend>
          <div className="mt-5 space-y-6">
            <div>
              <label htmlFor="book-summary" className="font-medium text-ivory">
                Kısa özet
                <RequiredLabel />
              </label>
              <textarea
                id="book-summary"
                name="summary"
                rows={5}
                value={form.summary}
                onChange={(event) => updateField("summary", event.target.value)}
                aria-invalid={summaryErrors.length > 0 || undefined}
                aria-describedby={summaryErrors.length ? "book-summary-errors" : undefined}
                className={`${fieldClassName} resize-y`}
              />
              <FieldErrors id="book-summary-errors" issues={summaryErrors} />
            </div>

            {([1, 2, 3] as const).map((number) => {
              const titleField = `keyIdea${number === 1 ? "One" : number === 2 ? "Two" : "Three"}Title` as keyof BookReviewFormState;
              const descriptionField = `keyIdea${number === 1 ? "One" : number === 2 ? "Two" : "Three"}Description` as keyof BookReviewFormState;
              return (
                <div key={number} className="grid gap-4 rounded-sm border border-border bg-background p-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`book-key-idea-${number}-title`} className="font-medium text-ivory">
                      Ana fikir {number} başlığı
                      <RequiredLabel optional />
                    </label>
                    <input
                      id={`book-key-idea-${number}-title`}
                      name={titleField}
                      type="text"
                      value={form[titleField] as string}
                      onChange={(event) => updateField(titleField, event.target.value)}
                      aria-invalid={keyIdeaErrors.length > 0 || undefined}
                      aria-describedby={keyIdeaErrors.length ? "book-key-ideas-errors" : undefined}
                      className={fieldClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor={`book-key-idea-${number}-description`} className="font-medium text-ivory">
                      Ana fikir {number} açıklaması
                      <RequiredLabel optional />
                    </label>
                    <textarea
                      id={`book-key-idea-${number}-description`}
                      name={descriptionField}
                      rows={3}
                      value={form[descriptionField] as string}
                      onChange={(event) => updateField(descriptionField, event.target.value)}
                      aria-invalid={keyIdeaErrors.length > 0 || undefined}
                      aria-describedby={keyIdeaErrors.length ? "book-key-ideas-errors" : undefined}
                      className={`${fieldClassName} resize-y`}
                    />
                  </div>
                </div>
              );
            })}
            <FieldErrors id="book-key-ideas-errors" issues={keyIdeaErrors} />

            <div className="grid gap-5 sm:grid-cols-2">
              {([
                ["strengths", "Güçlü yönler"],
                ["weaknesses", "Zayıf yönler"],
                ["whoShouldRead", "Kimler okumalı"],
                ["whoShouldNotRead", "Kimler okumamalı"],
              ] as const).map(([field, label]) => (
                <div key={field}>
                  <label htmlFor={`book-${field}`} className="font-medium text-ivory">
                    {label}
                    <RequiredLabel optional />
                  </label>
                  <textarea
                    id={`book-${field}`}
                    name={field}
                    rows={4}
                    value={form[field]}
                    onChange={(event) => updateField(field, event.target.value)}
                    aria-describedby={`book-${field}-help`}
                    className={`${fieldClassName} resize-y`}
                  />
                  <p id={`book-${field}-help`} className="mt-2 text-xs text-muted">
                    Her satır ayrı bir maddeye dönüşür.
                  </p>
                </div>
              ))}
            </div>

            <div>
              <label htmlFor="book-personal-evaluation" className="font-medium text-ivory">
                Kişisel değerlendirme
                <RequiredLabel />
              </label>
              <textarea
                id="book-personal-evaluation"
                name="personalEvaluation"
                rows={6}
                value={form.personalEvaluation}
                onChange={(event) => updateField("personalEvaluation", event.target.value)}
                aria-invalid={personalEvaluationErrors.length > 0 || undefined}
                aria-describedby={personalEvaluationErrors.length ? "book-personal-evaluation-errors" : undefined}
                className={`${fieldClassName} resize-y`}
              />
              <FieldErrors id="book-personal-evaluation-errors" issues={personalEvaluationErrors} />
            </div>

            <div className="grid gap-5 rounded-sm border border-border bg-background p-4 sm:grid-cols-3">
              <div>
                <label htmlFor="book-application-title" className="font-medium text-ivory">
                  Uygulama notu başlığı
                  <RequiredLabel optional />
                </label>
                <input
                  id="book-application-title"
                  name="applicationNoteTitle"
                  type="text"
                  value={form.applicationNoteTitle}
                  onChange={(event) => updateField("applicationNoteTitle", event.target.value)}
                  className={fieldClassName}
                />
              </div>
              <div>
                <label htmlFor="book-application-description" className="font-medium text-ivory">
                  Açıklama
                  <RequiredLabel optional />
                </label>
                <textarea
                  id="book-application-description"
                  name="applicationNoteDescription"
                  rows={3}
                  value={form.applicationNoteDescription}
                  onChange={(event) => updateField("applicationNoteDescription", event.target.value)}
                  className={`${fieldClassName} resize-y`}
                />
              </div>
              <div>
                <label htmlFor="book-application-action" className="font-medium text-ivory">
                  Eylem
                  <RequiredLabel optional />
                </label>
                <textarea
                  id="book-application-action"
                  name="applicationNoteAction"
                  rows={3}
                  value={form.applicationNoteAction}
                  onChange={(event) => updateField("applicationNoteAction", event.target.value)}
                  className={`${fieldClassName} resize-y`}
                />
              </div>
            </div>

            <div className="grid gap-5 rounded-sm border border-border bg-background p-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label htmlFor="book-quote-text" className="font-medium text-ivory">
                  Alıntı
                  <RequiredLabel optional />
                </label>
                <textarea
                  id="book-quote-text"
                  name="quoteText"
                  rows={4}
                  value={form.quoteText}
                  onChange={(event) => updateField("quoteText", event.target.value)}
                  className={`${fieldClassName} resize-y`}
                />
              </div>
              <div>
                <label htmlFor="book-quote-page" className="font-medium text-ivory">
                  Sayfa
                  <RequiredLabel optional />
                </label>
                <input
                  id="book-quote-page"
                  name="quotePage"
                  type="number"
                  min="1"
                  step="1"
                  value={form.quotePage}
                  onChange={(event) => updateField("quotePage", event.target.value)}
                  className={fieldClassName}
                />
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="book-quote-note" className="font-medium text-ivory">
                  Alıntı notu
                  <RequiredLabel optional />
                </label>
                <input
                  id="book-quote-note"
                  name="quoteNote"
                  type="text"
                  value={form.quoteNote}
                  onChange={(event) => updateField("quoteNote", event.target.value)}
                  className={fieldClassName}
                />
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className={fieldsetClassName}>
          <legend className="px-2 text-2xl text-ivory">Puan</legend>
          <div className="mt-5 max-w-sm">
            <label htmlFor="book-rating" className="font-medium text-ivory">
              10 üzerinden puan
              <RequiredLabel />
            </label>
            <input
              id="book-rating"
              name="rating"
              type="number"
              inputMode="decimal"
              min="0"
              max="10"
              step="0.1"
              value={form.rating}
              onChange={(event) => updateField("rating", event.target.value)}
              aria-invalid={ratingErrors.length > 0 || undefined}
              aria-describedby={ratingErrors.length ? "book-rating-help book-rating-errors" : "book-rating-help"}
              className={fieldClassName}
            />
            <p id="book-rating-help" className="mt-2 text-xs text-muted">
              En fazla bir ondalık basamak kullanın.
            </p>
            <FieldErrors id="book-rating-errors" issues={ratingErrors} />
          </div>
        </fieldset>

        <fieldset className={fieldsetClassName}>
          <legend className="px-2 text-2xl text-ivory">SEO</legend>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="book-seo-title" className="font-medium text-ivory">
                SEO başlığı
                <RequiredLabel />
              </label>
              <input
                id="book-seo-title"
                name="seoTitle"
                type="text"
                value={form.seoTitle}
                onChange={(event) => updateField("seoTitle", event.target.value)}
                aria-invalid={seoTitleErrors.length > 0 || undefined}
                aria-describedby={seoTitleErrors.length ? "book-seo-title-errors" : undefined}
                className={fieldClassName}
              />
              <FieldErrors id="book-seo-title-errors" issues={seoTitleErrors} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="book-seo-description" className="font-medium text-ivory">
                SEO açıklaması
                <RequiredLabel />
              </label>
              <textarea
                id="book-seo-description"
                name="seoDescription"
                rows={4}
                value={form.seoDescription}
                onChange={(event) => updateField("seoDescription", event.target.value)}
                aria-invalid={seoDescriptionErrors.length > 0 || undefined}
                aria-describedby={seoDescriptionErrors.length ? "book-seo-description-errors" : undefined}
                className={`${fieldClassName} resize-y`}
              />
              <FieldErrors id="book-seo-description-errors" issues={seoDescriptionErrors} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="book-canonical" className="font-medium text-ivory">
                Canonical URL
                <RequiredLabel optional />
              </label>
              <input
                id="book-canonical"
                name="canonical"
                type="url"
                value={form.canonical}
                onChange={(event) => updateField("canonical", event.target.value)}
                className={fieldClassName}
              />
            </div>
            <label className="flex min-h-11 items-center gap-3 rounded-sm border border-border bg-background px-4 py-3 text-sm text-ivory">
              <input
                name="seoIndex"
                type="checkbox"
                checked={form.seoIndex}
                onChange={(event) => updateField("seoIndex", event.target.checked)}
                className="size-5 accent-[var(--color-accent)]"
              />
              Arama motorları indeksleyebilir
            </label>
            <label className="flex min-h-11 items-center gap-3 rounded-sm border border-border bg-background px-4 py-3 text-sm text-ivory">
              <input
                name="seoFollow"
                type="checkbox"
                checked={form.seoFollow}
                onChange={(event) => updateField("seoFollow", event.target.checked)}
                className="size-5 accent-[var(--color-accent)]"
              />
              Bağlantılar takip edilebilir
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-sm bg-accent px-6 py-3 text-base font-semibold text-ink transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none sm:w-auto"
        >
          Kitap incelemesini doğrula
        </button>
      </form>

      {submission && (
        <BookReviewValidationResult
          bookReview={submission.bookReview}
          result={submission.validation}
        />
      )}
    </>
  );
}
