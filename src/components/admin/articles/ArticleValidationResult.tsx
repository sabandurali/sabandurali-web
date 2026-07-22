import {
  ARTICLE_STATUS_LABELS,
  ARTICLE_VISIBILITY_LABELS,
} from "@/components/admin/articles/article-admin-labels";
import type {
  Article,
  ArticleValidationResult as ValidationResult,
  ValidationIssue,
} from "@/content/articles/types";

type ArticleValidationResultProps = {
  article: Article;
  result: ValidationResult;
};

const ISSUE_PATH_LABELS: Readonly<Record<string, string>> = {
  title: "Başlık",
  slug: "Slug",
  language: "Dil",
  summary: "Kısa özet",
  category: "Ana kategori",
  author: "Yazar",
  coverImage: "Kapak görseli",
  "coverImage.alt": "Kapak görseli alternatif metni",
  content: "Başlangıç içeriği",
  "seo.title": "SEO başlığı",
  "seo.description": "Meta açıklaması",
  status: "Durum",
  publishedAt: "Yayın tarihi",
  scheduledAt: "Planlanan yayın tarihi",
  sources: "Kaynaklar",
};

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
            {ISSUE_PATH_LABELS[issue.path] ?? issue.path}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted">{issue.message}</p>
          <p className="mt-2 break-all font-mono text-xs text-accent-soft">
            {issue.code} · {issue.path}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function ArticleValidationResult({
  article,
  result,
}: ArticleValidationResultProps) {
  const heading = article.content.find((block) => block.type === "heading");
  const paragraph = article.content.find((block) => block.type === "paragraph");

  return (
    <section
      aria-labelledby="validation-result-title"
      aria-live="polite"
      aria-atomic="true"
      className="mt-10 space-y-6 border-t border-border pt-10"
    >
      <div className="rounded-sm border border-accent bg-surface p-5 sm:p-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent-soft">
          DOĞRULAMA SONUCU
        </p>
        <h2 id="validation-result-title" className="mt-3 text-3xl text-ivory">
          Valid: {result.valid ? "Evet" : "Hayır"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Bu sonuç mevcut Article doğrulama çekirdeğinin yayın hazırlığı
          kontrolüdür. Veri kaydedilmedi veya yayınlanmadı.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="validation-errors-title"
          className="rounded-sm border border-border bg-surface/70 p-5 sm:p-6"
        >
          <h3 id="validation-errors-title" className="text-2xl text-ivory">
            Hatalar ({result.errors.length})
          </h3>
          <IssueList
            issues={result.errors}
            emptyMessage="Yayınlamayı engelleyen zorunlu eksik yok."
          />
        </section>

        <section
          aria-labelledby="validation-warnings-title"
          className="rounded-sm border border-border bg-surface/70 p-5 sm:p-6"
        >
          <h3 id="validation-warnings-title" className="text-2xl text-ivory">
            Uyarılar ({result.warnings.length})
          </h3>
          <IssueList
            issues={result.warnings}
            emptyMessage="Kalite veya SEO uyarısı yok."
          />
        </section>
      </div>

      <section
        aria-labelledby="article-preview-title"
        className="rounded-sm border border-border bg-surface/70 p-5 sm:p-6"
      >
        <p className="text-xs font-semibold tracking-[0.18em] text-accent-soft">
          GÜVENLİ ÖN İZLEME
        </p>
        <h3 id="article-preview-title" className="mt-3 text-3xl text-ivory">
          {article.title || "Başlıksız makale"}
        </h3>
        <p className="mt-2 break-all font-mono text-xs text-muted">
          {article.slug || "slug-yok"}
        </p>
        <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
          {article.summary || "Kısa özet girilmedi."}
        </p>

        <div className="mt-6 rounded-sm border border-border bg-background p-5">
          <h4 className="text-2xl text-ivory">
            {heading?.text || "H2 başlık girilmedi."}
          </h4>
          <p className="mt-3 text-sm leading-7 text-muted">
            {paragraph?.text || "Paragraf girilmedi."}
          </p>
        </div>

        <dl className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-muted">SEO başlığı</dt>
            <dd className="mt-1 break-words text-sm text-ivory">
              {article.seo.title || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">SEO açıklaması</dt>
            <dd className="mt-1 break-words text-sm text-ivory">
              {article.seo.description || "—"}
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
        </dl>
      </section>
    </section>
  );
}
