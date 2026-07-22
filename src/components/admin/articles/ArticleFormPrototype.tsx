"use client";

import { useState, type FormEvent } from "react";
import {
  ARTICLE_LANGUAGE_LABELS,
  ARTICLE_STATUS_LABELS,
  ARTICLE_VISIBILITY_LABELS,
} from "@/components/admin/articles/article-admin-labels";
import {
  INITIAL_ARTICLE_FORM_STATE,
  mapArticleFormStateToArticle,
  type ArticleFormState,
} from "@/components/admin/articles/article-form";
import ArticleValidationResult from "@/components/admin/articles/ArticleValidationResult";
import {
  ARTICLE_CATEGORIES,
  ARTICLE_CATEGORY_LABELS,
  ARTICLE_LANGUAGES,
  ARTICLE_STATUSES,
  ARTICLE_VISIBILITIES,
} from "@/content/articles/constants";
import { createArticleSlug } from "@/content/articles/helpers";
import { validateArticle } from "@/content/articles/schema";
import type {
  Article,
  ArticleValidationResult as ValidationResult,
  ValidationIssue,
} from "@/content/articles/types";

type Submission = {
  article: Article;
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

export default function ArticleFormPrototype() {
  const [form, setForm] = useState<ArticleFormState>(
    INITIAL_ARTICLE_FORM_STATE,
  );
  const [slugWasEdited, setSlugWasEdited] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);

  function updateField<Key extends keyof ArticleFormState>(
    field: Key,
    value: ArticleFormState[Key],
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
      slug: slugWasEdited ? current.slug : createArticleSlug(title),
    }));
    setSubmission(null);
  }

  function handleSlugChange(slug: string) {
    setSlugWasEdited(true);
    updateField("slug", slug);
  }

  function regenerateSlug() {
    setSlugWasEdited(false);
    updateField("slug", createArticleSlug(form.title));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const article = mapArticleFormStateToArticle(form);
    const validation = validateArticle(article, { forPublication: true });
    setSubmission({ article, validation });
  }

  const titleErrors = getErrors(["title"]);
  const slugErrors = getErrors(["slug"]);
  const summaryErrors = getErrors(["summary"]);
  const categoryErrors = getErrors(["category"]);
  const authorErrors = getErrors(["author"]);
  const coverImageErrors = getErrors(["coverImage"]);
  const coverAltErrors = getErrors(["coverImage.alt"]);
  const contentErrors = getErrors(["content"]);
  const seoTitleErrors = getErrors(["seo.title"]);
  const seoDescriptionErrors = getErrors(["seo.description"]);
  const languageErrors = getErrors(["language"]);
  const statusErrors = getErrors(["status", "publishedAt", "scheduledAt"]);

  return (
    <>
      <form noValidate onSubmit={handleSubmit} className="mt-8 space-y-6">
        <p className="rounded-sm border border-accent bg-surface px-5 py-4 text-sm leading-6 text-ivory">
          Bu prototip veriyi kaydetmez veya yayınlamaz. Gönderim yalnızca
          tarayıcı belleğinde Article nesnesi ve doğrulama sonucu üretir.
        </p>

        <fieldset className={fieldsetClassName}>
          <legend className="px-2 text-2xl text-ivory">Temel bilgiler</legend>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="article-title" className="font-medium text-ivory">
                Başlık
                <RequiredLabel />
              </label>
              <input
                id="article-title"
                name="title"
                type="text"
                required
                value={form.title}
                onChange={(event) => handleTitleChange(event.target.value)}
                aria-invalid={titleErrors.length > 0 || undefined}
                aria-describedby={titleErrors.length > 0 ? "article-title-errors" : undefined}
                className={fieldClassName}
              />
              <FieldErrors id="article-title-errors" issues={titleErrors} />
            </div>

            <div className="sm:col-span-2">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <label htmlFor="article-slug" className="font-medium text-ivory">
                  Slug
                  <RequiredLabel />
                </label>
                <button
                  type="button"
                  onClick={regenerateSlug}
                  className="min-h-11 text-sm text-accent-soft underline decoration-border underline-offset-4 transition-colors hover:text-accent-strong motion-reduce:transition-none"
                >
                  Başlıktan yeniden oluştur
                </button>
              </div>
              <input
                id="article-slug"
                name="slug"
                type="text"
                required
                value={form.slug}
                onChange={(event) => handleSlugChange(event.target.value)}
                aria-invalid={slugErrors.length > 0 || undefined}
                aria-describedby={slugErrors.length > 0 ? "article-slug-errors" : undefined}
                className={fieldClassName}
              />
              <p className="mt-2 text-xs leading-5 text-muted">
                Başlık değiştikçe öneri güncellenir; elle düzenledikten sonra
                otomatik olarak ezilmez.
              </p>
              <FieldErrors id="article-slug-errors" issues={slugErrors} />
            </div>

            <div>
              <label htmlFor="article-language" className="font-medium text-ivory">
                Dil
                <RequiredLabel />
              </label>
              <select
                id="article-language"
                name="language"
                required
                value={form.language}
                onChange={(event) => updateField("language", event.target.value as ArticleFormState["language"])}
                aria-invalid={languageErrors.length > 0 || undefined}
                aria-describedby={languageErrors.length > 0 ? "article-language-errors" : undefined}
                className={fieldClassName}
              >
                {ARTICLE_LANGUAGES.map((language) => (
                  <option key={language} value={language}>
                    {ARTICLE_LANGUAGE_LABELS[language]}
                  </option>
                ))}
              </select>
              <FieldErrors id="article-language-errors" issues={languageErrors} />
            </div>

            <div>
              <label htmlFor="article-category" className="font-medium text-ivory">
                Ana kategori
                <RequiredLabel />
              </label>
              <select
                id="article-category"
                name="category"
                required
                value={form.category}
                onChange={(event) => updateField("category", event.target.value as ArticleFormState["category"])}
                aria-invalid={categoryErrors.length > 0 || undefined}
                aria-describedby={categoryErrors.length > 0 ? "article-category-errors" : undefined}
                className={fieldClassName}
              >
                <option value="">Kategori seçin</option>
                {ARTICLE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {ARTICLE_CATEGORY_LABELS[category].tr}
                  </option>
                ))}
              </select>
              <FieldErrors id="article-category-errors" issues={categoryErrors} />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="article-summary" className="font-medium text-ivory">
                Kısa özet
                <RequiredLabel />
              </label>
              <textarea
                id="article-summary"
                name="summary"
                required
                rows={4}
                value={form.summary}
                onChange={(event) => updateField("summary", event.target.value)}
                aria-invalid={summaryErrors.length > 0 || undefined}
                aria-describedby={summaryErrors.length > 0 ? "article-summary-errors" : undefined}
                className={`${fieldClassName} resize-y`}
              />
              <FieldErrors id="article-summary-errors" issues={summaryErrors} />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="article-author" className="font-medium text-ivory">
                Yazar
                <RequiredLabel />
              </label>
              <input
                id="article-author"
                name="author"
                type="text"
                required
                value={form.authorName}
                onChange={(event) => updateField("authorName", event.target.value)}
                aria-invalid={authorErrors.length > 0 || undefined}
                aria-describedby={authorErrors.length > 0 ? "article-author-errors" : undefined}
                className={fieldClassName}
              />
              <FieldErrors id="article-author-errors" issues={authorErrors} />
            </div>
          </div>
        </fieldset>

        <fieldset className={fieldsetClassName}>
          <legend className="px-2 text-2xl text-ivory">Kapak görseli</legend>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="article-cover-src" className="font-medium text-ivory">
                Görsel yolu
                <RequiredLabel />
              </label>
              <input
                id="article-cover-src"
                name="coverImageSrc"
                type="text"
                required
                placeholder="/articles/ornek-kapak.jpg"
                value={form.coverImageSrc}
                onChange={(event) => updateField("coverImageSrc", event.target.value)}
                aria-invalid={coverImageErrors.length > 0 || undefined}
                aria-describedby={coverImageErrors.length > 0 ? "article-cover-src-errors" : undefined}
                className={fieldClassName}
              />
              <FieldErrors id="article-cover-src-errors" issues={coverImageErrors} />
            </div>

            <div>
              <label htmlFor="article-cover-alt" className="font-medium text-ivory">
                Alternatif metin
                <RequiredLabel />
              </label>
              <input
                id="article-cover-alt"
                name="coverImageAlt"
                type="text"
                required
                value={form.coverImageAlt}
                onChange={(event) => updateField("coverImageAlt", event.target.value)}
                aria-invalid={coverAltErrors.length > 0 || undefined}
                aria-describedby={coverAltErrors.length > 0 ? "article-cover-alt-errors" : undefined}
                className={fieldClassName}
              />
              <FieldErrors id="article-cover-alt-errors" issues={coverAltErrors} />
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted">
            Yalnızca bir dosya yolu sınanır; yükleme yapılmaz.
          </p>
        </fieldset>

        <fieldset className={fieldsetClassName}>
          <legend className="px-2 text-2xl text-ivory">Başlangıç içeriği</legend>
          <div className="mt-5 space-y-5">
            <div>
              <label htmlFor="article-heading" className="font-medium text-ivory">
                H2 başlık
                <RequiredLabel />
              </label>
              <input
                id="article-heading"
                name="heading"
                type="text"
                required
                value={form.heading}
                onChange={(event) => updateField("heading", event.target.value)}
                aria-invalid={contentErrors.length > 0 || undefined}
                aria-describedby={contentErrors.length > 0 ? "article-content-errors" : undefined}
                className={fieldClassName}
              />
              <FieldErrors id="article-content-errors" issues={contentErrors} />
            </div>

            <div>
              <label htmlFor="article-paragraph" className="font-medium text-ivory">
                Paragraf
                <RequiredLabel />
              </label>
              <textarea
                id="article-paragraph"
                name="paragraph"
                required
                rows={7}
                value={form.paragraph}
                onChange={(event) => updateField("paragraph", event.target.value)}
                className={`${fieldClassName} resize-y`}
              />
            </div>
          </div>
        </fieldset>

        <fieldset className={fieldsetClassName}>
          <legend className="px-2 text-2xl text-ivory">SEO</legend>
          <div className="mt-5 space-y-5">
            <div>
              <label htmlFor="article-seo-title" className="font-medium text-ivory">
                SEO başlığı
                <RequiredLabel />
              </label>
              <input
                id="article-seo-title"
                name="seoTitle"
                type="text"
                required
                value={form.seoTitle}
                onChange={(event) => updateField("seoTitle", event.target.value)}
                aria-invalid={seoTitleErrors.length > 0 || undefined}
                aria-describedby={seoTitleErrors.length > 0 ? "article-seo-title-errors" : undefined}
                className={fieldClassName}
              />
              <FieldErrors id="article-seo-title-errors" issues={seoTitleErrors} />
            </div>

            <div>
              <label htmlFor="article-seo-description" className="font-medium text-ivory">
                Meta açıklaması
                <RequiredLabel />
              </label>
              <textarea
                id="article-seo-description"
                name="seoDescription"
                required
                rows={5}
                value={form.seoDescription}
                onChange={(event) => updateField("seoDescription", event.target.value)}
                aria-invalid={seoDescriptionErrors.length > 0 || undefined}
                aria-describedby={seoDescriptionErrors.length > 0 ? "article-seo-description-errors" : "article-seo-description-count"}
                className={`${fieldClassName} resize-y`}
              />
              <p id="article-seo-description-count" className="mt-2 text-xs text-muted">
                {form.seoDescription.trim().length} karakter · önerilen 140–160
              </p>
              <FieldErrors id="article-seo-description-errors" issues={seoDescriptionErrors} />
            </div>

            <div>
              <label htmlFor="article-canonical" className="font-medium text-ivory">
                Canonical URL
                <RequiredLabel optional />
              </label>
              <input
                id="article-canonical"
                name="canonical"
                type="url"
                value={form.canonical}
                onChange={(event) => updateField("canonical", event.target.value)}
                className={fieldClassName}
              />
            </div>
          </div>
        </fieldset>

        <fieldset className={fieldsetClassName}>
          <legend className="px-2 text-2xl text-ivory">Yayın bilgileri</legend>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="article-status" className="font-medium text-ivory">
                Durum
                <RequiredLabel />
              </label>
              <select
                id="article-status"
                name="status"
                required
                value={form.status}
                onChange={(event) => updateField("status", event.target.value as ArticleFormState["status"])}
                aria-invalid={statusErrors.length > 0 || undefined}
                aria-describedby={statusErrors.length > 0 ? "article-status-errors" : undefined}
                className={fieldClassName}
              >
                {ARTICLE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {ARTICLE_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <FieldErrors id="article-status-errors" issues={statusErrors} />
            </div>

            <div>
              <label htmlFor="article-visibility" className="font-medium text-ivory">
                Görünürlük
                <RequiredLabel />
              </label>
              <select
                id="article-visibility"
                name="visibility"
                required
                value={form.visibility}
                onChange={(event) => updateField("visibility", event.target.value as ArticleFormState["visibility"])}
                className={fieldClassName}
              >
                {ARTICLE_VISIBILITIES.map((visibility) => (
                  <option key={visibility} value={visibility}>
                    {ARTICLE_VISIBILITY_LABELS[visibility]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-muted">
            Gönderim, mevcut doğrulama sistemini yayın hazırlığı modunda
            çalıştırır. Repository, dosya sistemi ve API çağrılmaz.
          </p>
          <button
            type="submit"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-sm bg-accent px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-accent-strong motion-reduce:transition-none"
          >
            Makaleyi doğrula
          </button>
        </div>
      </form>

      {submission !== null ? (
        <ArticleValidationResult
          article={submission.article}
          result={submission.validation}
        />
      ) : null}
    </>
  );
}
