import {
  BOOK_READING_STATUS_LABELS,
  BOOK_REVIEW_STATUS_LABELS,
} from "@/components/admin/books/book-admin-labels";
import { BOOK_CATEGORY_LABELS } from "@/content/books/constants";
import type {
  BookReview,
  BookReviewValidationResult as ValidationResult,
} from "@/content/books/types";
import type { ValidationIssue } from "@/content/articles/types";

type BookReviewValidationResultProps = {
  bookReview: BookReview;
  result: ValidationResult;
};

const ISSUE_PATH_LABELS: Readonly<Record<string, string>> = {
  title: "Başlık",
  slug: "Slug",
  language: "Dil",
  authors: "Yazar",
  category: "Kategori",
  readingStatus: "Okuma durumu",
  reviewStatus: "İnceleme durumu",
  startedAt: "Başlama tarihi",
  completedAt: "Tamamlama tarihi",
  isbn10: "ISBN-10",
  isbn13: "ISBN-13",
  coverImage: "Kapak görseli",
  "coverImage.alt": "Kapak görseli alternatif metni",
  summary: "Kısa özet",
  keyIdeas: "Ana fikirler",
  strengths: "Güçlü yönler",
  weaknesses: "Zayıf yönler",
  whoShouldRead: "Kimler okumalı",
  whoShouldNotRead: "Kimler okumamalı",
  applicationNotes: "Uygulama notu",
  personalEvaluation: "Kişisel değerlendirme",
  rating: "Puan",
  "seo.title": "SEO başlığı",
  "seo.description": "SEO açıklaması",
  publishedAt: "Yayın tarihi",
};

function getIssuePathLabel(path: string): string {
  if (path.startsWith("quotes.")) {
    return "Alıntı";
  }

  return ISSUE_PATH_LABELS[path] ?? "Kitap incelemesi";
}

function IssueList({
  emptyMessage,
  issues,
}: {
  emptyMessage: string;
  issues: ReadonlyArray<ValidationIssue>;
}) {
  if (issues.length === 0) {
    return <p className="mt-3 text-sm text-muted">{emptyMessage}</p>;
  }

  return (
    <ul className="mt-3 space-y-3">
      {issues.map((issue, index) => (
        <li
          key={`${issue.code}-${issue.path}-${index}`}
          className="rounded-sm border border-border bg-background p-4"
        >
          <p className="text-sm font-semibold text-ivory">
            {getIssuePathLabel(issue.path)}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted">{issue.message}</p>
        </li>
      ))}
    </ul>
  );
}

function TextList({
  emptyMessage,
  items,
}: {
  emptyMessage: string;
  items: ReadonlyArray<string>;
}) {
  if (items.length === 0) {
    return <p className="mt-3 text-sm text-muted">{emptyMessage}</p>;
  }

  return (
    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="break-words">
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function BookReviewValidationResult({
  bookReview,
  result,
}: BookReviewValidationResultProps) {
  const authorNames = bookReview.authors.map((author) => author.name).join(", ");

  return (
    <section
      aria-labelledby="book-validation-result-title"
      aria-live="polite"
      aria-atomic="true"
      className="mt-10 space-y-6 border-t border-border pt-10"
    >
      <div className="rounded-sm border border-accent bg-surface p-5 sm:p-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent-soft">
          DOĞRULAMA SONUCU
        </p>
        <h2
          id="book-validation-result-title"
          className="mt-3 text-3xl text-ivory"
        >
          Geçerli: {result.valid ? "Evet" : "Hayır"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Sonuç mevcut BookReview doğrulama çekirdeğiyle üretildi. Veri
          kaydedilmedi veya yayımlanmadı.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="book-validation-errors-title"
          className="rounded-sm border border-border bg-surface/70 p-5 sm:p-6"
        >
          <h3 id="book-validation-errors-title" className="text-2xl text-ivory">
            Hatalar ({result.errors.length})
          </h3>
          <IssueList
            issues={result.errors}
            emptyMessage="Doğrulamayı engelleyen hata yok."
          />
        </section>

        <section
          aria-labelledby="book-validation-warnings-title"
          className="rounded-sm border border-border bg-surface/70 p-5 sm:p-6"
        >
          <h3 id="book-validation-warnings-title" className="text-2xl text-ivory">
            Uyarılar ({result.warnings.length})
          </h3>
          <IssueList
            issues={result.warnings}
            emptyMessage="İçerik veya SEO uyarısı yok."
          />
        </section>
      </div>

      <section
        aria-labelledby="book-review-preview-title"
        className="rounded-sm border border-border bg-surface/70 p-5 sm:p-6"
      >
        <p className="text-xs font-semibold tracking-[0.18em] text-accent-soft">
          GÜVENLİ ÖN İZLEME
        </p>
        <h3 id="book-review-preview-title" className="mt-3 text-3xl text-ivory">
          {bookReview.title || "Başlıksız kitap incelemesi"}
        </h3>
        <p className="mt-2 break-all font-mono text-xs text-muted">
          {bookReview.slug || "slug-yok"}
        </p>
        <p className="mt-2 text-sm text-accent-soft">
          {authorNames || "Yazar girilmedi"}
        </p>
        {bookReview.originalTitle && (
          <p className="mt-2 break-words text-sm italic text-muted">
            Özgün adı: {bookReview.originalTitle}
          </p>
        )}
        <p className="mt-5 max-w-3xl break-words text-base leading-7 text-muted">
          {bookReview.summary || "Kısa özet girilmedi."}
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <section className="rounded-sm border border-border bg-background p-5 lg:col-span-2">
            <h4 className="text-xl text-ivory">Ana fikirler</h4>
            {bookReview.keyIdeas.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Ana fikir girilmedi.</p>
            ) : (
              <ol className="mt-3 space-y-4">
                {bookReview.keyIdeas.map((idea) => (
                  <li key={idea.id}>
                    <p className="font-medium text-ivory">
                      {idea.title || "Başlıksız fikir"}
                    </p>
                    <p className="mt-1 break-words text-sm leading-6 text-muted">
                      {idea.description || "Açıklama girilmedi."}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <dl className="rounded-sm border border-border bg-background p-5 text-sm">
            <div>
              <dt className="text-xs text-muted">Puan</dt>
              <dd className="mt-1 text-ivory">
                {bookReview.rating === null ? "—" : `${bookReview.rating}/10`}
              </dd>
            </div>
            <div className="mt-4">
              <dt className="text-xs text-muted">Kategori</dt>
              <dd className="mt-1 text-ivory">
                {bookReview.category === null
                  ? "—"
                  : BOOK_CATEGORY_LABELS[bookReview.category].tr}
              </dd>
            </div>
            <div className="mt-4">
              <dt className="text-xs text-muted">Okuma durumu</dt>
              <dd className="mt-1 text-ivory">
                {BOOK_READING_STATUS_LABELS[bookReview.readingStatus]}
              </dd>
            </div>
            <div className="mt-4">
              <dt className="text-xs text-muted">İnceleme durumu</dt>
              <dd className="mt-1 text-ivory">
                {BOOK_REVIEW_STATUS_LABELS[bookReview.reviewStatus]}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <section className="rounded-sm border border-border bg-background p-5">
            <h4 className="text-xl text-ivory">Güçlü yönler</h4>
            <TextList
              items={bookReview.strengths}
              emptyMessage="Güçlü yön girilmedi."
            />
          </section>
          <section className="rounded-sm border border-border bg-background p-5">
            <h4 className="text-xl text-ivory">Zayıf yönler</h4>
            <TextList
              items={bookReview.weaknesses}
              emptyMessage="Zayıf yön girilmedi."
            />
          </section>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <section className="rounded-sm border border-border bg-background p-5">
            <h4 className="text-xl text-ivory">Kimler okumalı</h4>
            <TextList
              items={bookReview.whoShouldRead}
              emptyMessage="Hedef okuyucu girilmedi."
            />
          </section>
          <section className="rounded-sm border border-border bg-background p-5">
            <h4 className="text-xl text-ivory">Kimler okumamalı</h4>
            <TextList
              items={bookReview.whoShouldNotRead}
              emptyMessage="Bu alan için madde girilmedi."
            />
          </section>
        </div>

        <section className="mt-6 rounded-sm border border-border bg-background p-5">
          <h4 className="text-xl text-ivory">Kişisel değerlendirme</h4>
          <p className="mt-3 break-words text-sm leading-7 text-muted">
            {bookReview.personalEvaluation || "Kişisel değerlendirme girilmedi."}
          </p>
        </section>

        {bookReview.applicationNotes.length > 0 && (
          <section className="mt-6 rounded-sm border border-border bg-background p-5">
            <h4 className="text-xl text-ivory">Uygulama notu</h4>
            {bookReview.applicationNotes.map((note) => (
              <div key={note.id} className="mt-3">
                <p className="font-medium text-ivory">
                  {note.title || "Başlıksız uygulama notu"}
                </p>
                <p className="mt-1 break-words text-sm leading-6 text-muted">
                  {note.description || "Açıklama girilmedi."}
                </p>
                {note.action && (
                  <p className="mt-2 break-words text-sm text-accent-soft">
                    Eylem: {note.action}
                  </p>
                )}
              </div>
            ))}
          </section>
        )}

        {bookReview.quotes.length > 0 && (
          <section className="mt-6 rounded-sm border border-border bg-background p-5">
            <h4 className="text-xl text-ivory">Alıntı</h4>
            {bookReview.quotes.map((quote) => (
              <blockquote key={quote.id} className="mt-3 border-l-2 border-accent pl-4">
                <p className="break-words text-sm italic leading-7 text-muted">
                  {quote.text || "Alıntı metni girilmedi."}
                </p>
                {(quote.page !== undefined || quote.note) && (
                  <footer className="mt-2 text-xs text-accent-soft">
                    {quote.page === undefined ? "" : `Sayfa ${quote.page}`}
                    {quote.page !== undefined && quote.note ? " · " : ""}
                    {quote.note ?? ""}
                  </footer>
                )}
              </blockquote>
            ))}
          </section>
        )}

        <section className="mt-6 rounded-sm border border-border bg-background p-5">
          <h4 className="text-xl text-ivory">SEO özeti</h4>
          <dl className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted">SEO başlığı</dt>
              <dd className="mt-1 break-words text-sm text-ivory">
                {bookReview.seo.title || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Meta açıklaması</dt>
              <dd className="mt-1 break-words text-sm text-ivory">
                {bookReview.seo.description || "—"}
              </dd>
            </div>
          </dl>
        </section>
      </section>
    </section>
  );
}
