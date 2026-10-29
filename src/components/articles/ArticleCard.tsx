import {
  altLanguageAttribute,
  creditFromText,
  PublicationImage,
} from "@/components/pages/publication-media";
import Card from "@/components/ui/Card";
import { Credit } from "@/components/ui/Figure";
import { getAvailablePublicArticleImage } from "@/content/articles/article-images";
import {
  formatArticleDate,
  type ArticlePageContent,
} from "@/content/articles/article-page-content";
import { getArticlePath } from "@/content/articles/article-routes";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import { toDateTimeAttribute } from "@/lib/format-date";

type ArticleCardProps = {
  article: PublicArticleSummary;
  content: ArticlePageContent;
  headingLevel?: "h2" | "h3";
  /** Tighter card for dense lists: the summary is cut to three lines. */
  compact?: boolean;
};

/**
 * One article in a list: cover (with its credit), category, title link,
 * summary and publication date. The title is the only link and the card's
 * accessible name.
 */
export default function ArticleCard({
  article,
  content,
  headingLevel = "h2",
  compact = false,
}: ArticleCardProps) {
  const coverImage = getAvailablePublicArticleImage(article.featuredImage);
  const category = article.categories[0]?.name ?? content.categoryFallback;
  const publishedAt = formatArticleDate(article.publishedAt, content);
  const credit = creditFromText(article.featuredImage?.credit);

  return (
    <Card
      title={article.title}
      href={getArticlePath(article.slug, article.language)}
      headingLevel={headingLevel === "h2" ? 2 : 3}
      media={
        coverImage !== null && article.featuredImage !== null ? (
          <PublicationImage
            src={coverImage}
            alt={article.featuredImage.alt}
            {...altLanguageAttribute(
              article.featuredImage.altLanguage,
              article.language,
            )}
            layout="fill"
            sizes="(min-width: 1024px) 460px, (min-width: 640px) 50vw, 100vw"
          />
        ) : undefined
      }
      credit={
        coverImage !== null && credit !== null ? (
          <Credit credit={credit} locale={article.language} />
        ) : undefined
      }
      eyebrow={
        <>
          <span className="font-semibold text-ink">{category}</span>
          {publishedAt !== null ? (
            <>
              <span aria-hidden="true">·</span>
              <time
                dateTime={toDateTimeAttribute(article.publishedAt) ?? undefined}
                className="type-data-md"
              >
                {publishedAt}
              </time>
            </>
          ) : null}
        </>
      }
      cta={content.readArticle}
    >
      <p
        className={
          compact
            ? "m-0 line-clamp-3 type-small text-ink-muted"
            : "m-0 type-body text-ink-muted"
        }
      >
        {article.summary}
      </p>
    </Card>
  );
}
