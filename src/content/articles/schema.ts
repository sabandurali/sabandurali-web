import {
  ARTICLE_LANGUAGES,
  ARTICLE_STATUSES,
  HEADING_LEVELS,
  SEO_DESCRIPTION_RECOMMENDED_LENGTH,
} from "@/content/articles/constants";
import { createArticleSlug, findDuplicateTagGroups } from "@/content/articles/helpers";
import type {
  Article,
  ArticleValidationOptions,
  ArticleValidationResult,
  ValidationIssue,
} from "@/content/articles/types";

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function issue(code: string, path: string, message: string): ValidationIssue {
  return { code, path, message };
}

function hasInvalidHeadingLevel(article: Article): boolean {
  return article.content.some(
    (block) =>
      block.type === "heading" &&
      !HEADING_LEVELS.includes(block.level),
  );
}

function validatePublicationRequirements(
  article: Article,
  errors: ValidationIssue[],
): void {
  if (isBlank(article.title)) {
    errors.push(issue("title.required", "title", "Başlık zorunludur."));
  }

  if (isBlank(article.slug)) {
    errors.push(issue("slug.required", "slug", "Slug zorunludur."));
  }

  if (isBlank(article.summary)) {
    errors.push(
      issue("summary.required", "summary", "Kısa özet zorunludur."),
    );
  }

  if (article.category === null) {
    errors.push(
      issue("category.required", "category", "Ana kategori zorunludur."),
    );
  }

  if (article.coverImage === null) {
    errors.push(
      issue("cover_image.required", "coverImage", "Kapak görseli zorunludur."),
    );
  }

  if (isBlank(article.seo.title)) {
    errors.push(issue("seo.title_required", "seo.title", "SEO başlığı zorunludur."));
  }

  if (isBlank(article.seo.description)) {
    errors.push(
      issue(
        "seo.description_required",
        "seo.description",
        "SEO açıklaması zorunludur.",
      ),
    );
  }

  if (article.content.length === 0) {
    errors.push(
      issue(
        "content.required",
        "content",
        "En az bir içerik bloğu zorunludur.",
      ),
    );
  }

  if (!article.content.some((block) => block.type === "heading" && block.level === "h2")) {
    errors.push(
      issue(
        "content.h2_required",
        "content",
        "İçerikte en az bir h2 başlığı bulunmalıdır.",
      ),
    );
  }

  if (article.author === null || isBlank(article.author.name)) {
    errors.push(issue("author.required", "author", "Yazar zorunludur."));
  }

  if (article.status === "published" && article.publishedAt === null) {
    errors.push(
      issue(
        "published_at.required",
        "publishedAt",
        "Yayındaki bir makalenin yayın tarihi olmalıdır.",
      ),
    );
  }

  if (article.status === "scheduled" && article.scheduledAt === null) {
    errors.push(
      issue(
        "scheduled_at.required",
        "scheduledAt",
        "Planlanan bir makalenin yayın zamanı olmalıdır.",
      ),
    );
  }
}

function collectWarnings(article: Article): ValidationIssue[] {
  const warnings: ValidationIssue[] = [];
  const descriptionLength = article.seo.description.trim().length;

  if (
    descriptionLength > 0 &&
    (descriptionLength < SEO_DESCRIPTION_RECOMMENDED_LENGTH.min ||
      descriptionLength > SEO_DESCRIPTION_RECOMMENDED_LENGTH.max)
  ) {
    warnings.push(
      issue(
        "seo.description_length",
        "seo.description",
        `SEO açıklaması için önerilen uzunluk ${SEO_DESCRIPTION_RECOMMENDED_LENGTH.min}–${SEO_DESCRIPTION_RECOMMENDED_LENGTH.max} karakterdir.`,
      ),
    );
  }

  if (article.sources.length === 0) {
    warnings.push(
      issue(
        "sources.recommended",
        "sources",
        "Güvenilirlik için en az bir kaynak eklenmesi önerilir.",
      ),
    );
  }

  for (const duplicate of findDuplicateTagGroups(article.tags)) {
    warnings.push(
      issue(
        "tags.duplicate",
        "tags",
        `Aynı anlamı paylaşan etiketler bulundu: ${duplicate.tagIds.join(", ")}.`,
      ),
    );
  }

  return warnings;
}

export function validateArticle(
  article: Article,
  options: ArticleValidationOptions = {},
): ArticleValidationResult {
  const errors: ValidationIssue[] = [];
  const forPublication =
    options.forPublication ??
    (article.status === "scheduled" || article.status === "published");

  if (!ARTICLE_LANGUAGES.includes(article.language)) {
    errors.push(
      issue("language.invalid", "language", "Desteklenen bir dil seçilmelidir."),
    );
  }

  if (!ARTICLE_STATUSES.includes(article.status)) {
    errors.push(
      issue(
        "status.invalid",
        "status",
        "Desteklenen bir yayın durumu seçilmelidir.",
      ),
    );
  }

  if (article.coverImage !== null && isBlank(article.coverImage.alt)) {
    errors.push(
      issue(
        "cover_image.alt_required",
        "coverImage.alt",
        "Kapak görseli alternatif metni zorunludur.",
      ),
    );
  }

  if (hasInvalidHeadingLevel(article)) {
    errors.push(
      issue(
        "content.heading_level_invalid",
        "content",
        "İçerik başlıklarında yalnızca h2, h3 ve h4 kullanılabilir.",
      ),
    );
  }

  if (article.slug && article.slug !== createArticleSlug(article.slug)) {
    errors.push(
      issue(
        "slug.invalid",
        "slug",
        "Slug küçük harf, sayı ve tek tirelerden oluşmalıdır.",
      ),
    );
  }

  if (forPublication) {
    validatePublicationRequirements(article, errors);
  }

  const warnings = collectWarnings(article);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
