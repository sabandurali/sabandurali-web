import type { Metadata } from "next";
import Link from "next/link";
import {
  ARTICLE_LANGUAGE_LABELS,
  ARTICLE_STATUS_LABELS,
  ARTICLE_VISIBILITY_LABELS,
  formatAdminArticleDate,
} from "@/components/admin/articles/article-admin-labels";
import { getAllArticles } from "@/content/articles/article-data-source";
import { getArticlePath } from "@/content/articles/article-routes";
import { ARTICLE_CATEGORY_LABELS } from "@/content/articles/constants";
import { isPubliclyPublishedArticle } from "@/content/articles/repository/article-repository";

export const metadata: Metadata = {
  title: "Makaleler | Yönetim Prototipi",
  description:
    "Geliştirme ortamındaki örnek makalelerin salt okunur yönetim listesi.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminArticlesPage() {
  const articles = await getAllArticles();
  const summaries = [
    { label: "Toplam makale", value: articles.length },
    {
      label: "Taslak",
      value: articles.filter((article) => article.status === "draft").length,
    },
    {
      label: "Yayında",
      value: articles.filter((article) => article.status === "published").length,
    },
    {
      label: "Türkçe",
      value: articles.filter((article) => article.language === "tr").length,
    },
    {
      label: "İngilizce",
      value: articles.filter((article) => article.language === "en").length,
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
            Makaleler
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
            Repository içindeki yayınlanmış ve yayınlanmamış örnek kayıtları
            birlikte gösterir. Bu ekrandan veri değiştirilemez.
          </p>
        </div>

        <Link
          href="/yonetim/makaleler/yeni"
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-sm bg-accent px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-accent-strong motion-reduce:transition-none"
        >
          Yeni makale prototipi
        </Link>
      </header>

      <section aria-labelledby="article-summary-title" className="mt-8">
        <h2 id="article-summary-title" className="sr-only">
          Makale özeti
        </h2>
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-5">
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

      <section aria-labelledby="article-list-title" className="mt-10">
        <h2 id="article-list-title" className="text-2xl text-ivory">
          Repository kayıtları
        </h2>

        <ul className="mt-5 space-y-5">
          {articles.map((article) => {
            const isViewable = isPubliclyPublishedArticle(article);

            return (
              <li
                key={article.id}
                className="rounded-sm border border-border bg-surface/70 p-5 sm:p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-[0.16em] text-accent-soft">
                      {ARTICLE_LANGUAGE_LABELS[article.language]} · {ARTICLE_STATUS_LABELS[article.status]}
                    </p>
                    <h3 className="mt-2 break-words text-2xl leading-tight text-ivory">
                      {article.title}
                    </h3>
                    <p className="mt-2 break-all font-mono text-xs leading-5 text-muted">
                      /{article.slug}
                    </p>
                  </div>

                  <nav
                    aria-label={`${article.title} işlemleri`}
                    className="flex shrink-0 flex-wrap gap-3"
                  >
                    {isViewable ? (
                      <Link
                        href={getArticlePath(article.slug, article.language)}
                        className="inline-flex min-h-11 items-center rounded-sm border border-border px-4 py-2 text-sm text-ivory transition-colors hover:border-accent hover:text-accent-soft motion-reduce:transition-none"
                      >
                        Görüntüle
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        title="Yalnızca yayındaki public makaleler görüntülenebilir"
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
                    <dt className="text-xs text-muted">Dil</dt>
                    <dd className="mt-1 text-sm text-ivory">
                      {ARTICLE_LANGUAGE_LABELS[article.language]}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Durum</dt>
                    <dd className="mt-1 text-sm text-ivory">
                      {ARTICLE_STATUS_LABELS[article.status]}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Görünürlük</dt>
                    <dd className="mt-1 text-sm text-ivory">
                      {ARTICLE_VISIBILITY_LABELS[article.visibility]}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Kategori</dt>
                    <dd className="mt-1 text-sm text-ivory">
                      {article.category === null
                        ? "—"
                        : ARTICLE_CATEGORY_LABELS[article.category].tr}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Oluşturulma</dt>
                    <dd className="mt-1 text-sm text-ivory">
                      {formatAdminArticleDate(article.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Güncellenme</dt>
                    <dd className="mt-1 text-sm text-ivory">
                      {formatAdminArticleDate(article.updatedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Yayın tarihi</dt>
                    <dd className="mt-1 text-sm text-ivory">
                      {formatAdminArticleDate(article.publishedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Slug</dt>
                    <dd className="mt-1 break-all font-mono text-xs text-ivory">
                      {article.slug}
                    </dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
