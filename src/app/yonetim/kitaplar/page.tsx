import type { Metadata } from "next";
import Link from "next/link";
import {
  BOOK_READING_STATUS_LABELS,
  BOOK_REVIEW_LANGUAGE_LABELS,
  BOOK_REVIEW_STATUS_LABELS,
  formatAdminBookReviewDate,
} from "@/components/admin/books/book-admin-labels";
import { getAllBookReviews } from "@/content/books/book-data-source";
import { getBookReviewPath } from "@/content/books/book-routes";
import { BOOK_CATEGORY_LABELS } from "@/content/books/constants";
import { isPubliclyPublishedBookReview } from "@/content/books/repository/book-review-repository";

export const metadata: Metadata = {
  title: "Kitaplar | Yönetim Prototipi",
  description:
    "Geliştirme ortamındaki kitap incelemelerinin salt okunur yönetim listesi.",
  robots: { index: false, follow: false },
};

export default async function AdminBooksPage() {
  const bookReviews = await getAllBookReviews();
  const summaries = [
    { label: "Toplam inceleme", value: bookReviews.length },
    {
      label: "Planlandı",
      value: bookReviews.filter((review) => review.readingStatus === "planned")
        .length,
    },
    {
      label: "Okunuyor",
      value: bookReviews.filter((review) => review.readingStatus === "reading")
        .length,
    },
    {
      label: "Tamamlandı",
      value: bookReviews.filter((review) => review.readingStatus === "completed")
        .length,
    },
    {
      label: "Taslak",
      value: bookReviews.filter((review) => review.reviewStatus === "draft")
        .length,
    },
    {
      label: "Yayında",
      value: bookReviews.filter((review) => review.reviewStatus === "published")
        .length,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-accent-soft">
            SALT OKUNUR LİSTE
          </p>
          <h1 className="mt-3 text-4xl leading-tight text-ivory sm:text-5xl">
            Kitap İncelemeleri
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
            Repository içindeki tüm durumları birlikte gösterir. Bu ekrandan
            veri değiştirilemez.
          </p>
        </div>

        <Link
          href="/yonetim/kitaplar/yeni"
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-sm bg-accent px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-accent-strong motion-reduce:transition-none"
        >
          Yeni kitap incelemesi prototipi
        </Link>
      </header>

      <section aria-labelledby="book-review-summary-title" className="mt-8">
        <h2 id="book-review-summary-title" className="sr-only">
          Kitap incelemesi özeti
        </h2>
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {summaries.map((summary) => (
            <div
              key={summary.label}
              className="rounded-sm border border-border bg-surface/70 p-4"
            >
              <dt className="text-xs text-muted">{summary.label}</dt>
              <dd className="mt-2 text-2xl font-semibold text-ivory">
                {summary.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="book-review-list-title" className="mt-10">
        <h2 id="book-review-list-title" className="text-2xl text-ivory">
          Repository kayıtları
        </h2>

        {bookReviews.length === 0 ? (
          <p className="mt-5 rounded-sm border border-border bg-surface/70 p-6 text-muted">
            Henüz kitap incelemesi bulunmuyor.
          </p>
        ) : (
          <ul className="mt-5 space-y-5">
            {bookReviews.map((review) => {
              const isViewable = isPubliclyPublishedBookReview(review);

              return (
                <li
                  key={review.id}
                  className="rounded-sm border border-border bg-surface/70 p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold tracking-[0.16em] text-accent-soft">
                        {BOOK_REVIEW_LANGUAGE_LABELS[review.language]} · {BOOK_REVIEW_STATUS_LABELS[review.reviewStatus]}
                      </p>
                      <h3 className="mt-2 break-words text-2xl leading-tight text-ivory">
                        {review.title}
                      </h3>
                      {review.originalTitle && (
                        <p className="mt-2 break-words text-sm italic text-muted">
                          Özgün adı: {review.originalTitle}
                        </p>
                      )}
                      <p className="mt-2 break-all font-mono text-xs leading-5 text-muted">
                        /{review.slug}
                      </p>
                    </div>

                    <nav
                      aria-label={`${review.title} işlemleri`}
                      className="flex shrink-0 flex-wrap gap-3"
                    >
                      {isViewable ? (
                        <Link
                          href={getBookReviewPath(review.slug, review.language)}
                          className="inline-flex min-h-11 items-center rounded-sm border border-border px-4 py-2 text-sm text-ivory transition-colors hover:border-accent hover:text-accent-soft motion-reduce:transition-none"
                        >
                          Görüntüle
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          title="Yalnızca yayındaki public incelemeler görüntülenebilir"
                          className="inline-flex min-h-11 cursor-not-allowed items-center rounded-sm border border-border px-4 py-2 text-sm text-muted opacity-60"
                        >
                          Görüntüle — mevcut değil
                        </button>
                      )}
                      <button
                        type="button"
                        disabled
                        className="inline-flex min-h-11 cursor-not-allowed items-center rounded-sm border border-border px-4 py-2 text-sm text-muted opacity-60"
                      >
                        Düzenle — henüz uygulanmadı
                      </button>
                    </nav>
                  </div>

                  <dl className="mt-6 grid gap-x-6 gap-y-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="text-xs text-muted">Yazar</dt>
                      <dd className="mt-1 text-sm text-ivory">
                        {review.authors.map((author) => author.name).join(", ") || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Dil</dt>
                      <dd className="mt-1 text-sm text-ivory">
                        {BOOK_REVIEW_LANGUAGE_LABELS[review.language]}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Okuma durumu</dt>
                      <dd className="mt-1 text-sm text-ivory">
                        {BOOK_READING_STATUS_LABELS[review.readingStatus]}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">İnceleme durumu</dt>
                      <dd className="mt-1 text-sm text-ivory">
                        {BOOK_REVIEW_STATUS_LABELS[review.reviewStatus]}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Kategori</dt>
                      <dd className="mt-1 text-sm text-ivory">
                        {review.category === null
                          ? "—"
                          : BOOK_CATEGORY_LABELS[review.category].tr}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Puan</dt>
                      <dd className="mt-1 text-sm text-ivory">
                        {review.rating === null ? "—" : `${review.rating}/10`}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Oluşturulma</dt>
                      <dd className="mt-1 text-sm text-ivory">
                        {formatAdminBookReviewDate(review.createdAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Güncellenme</dt>
                      <dd className="mt-1 text-sm text-ivory">
                        {formatAdminBookReviewDate(review.updatedAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Yayın tarihi</dt>
                      <dd className="mt-1 text-sm text-ivory">
                        {formatAdminBookReviewDate(review.publishedAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Slug</dt>
                      <dd className="mt-1 break-all font-mono text-xs text-ivory">
                        {review.slug}
                      </dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
