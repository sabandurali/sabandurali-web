import Image from "next/image";
import Link from "next/link";
import { ARTICLE_CATEGORY_LABELS } from "@/content/articles/constants";
import { getAvailableLocalArticleImage } from "@/content/articles/article-images";
import {
  formatArticleDate,
  type ArticlePageContent,
} from "@/content/articles/article-page-content";
import { getArticlePath } from "@/content/articles/article-routes";
import type { Article } from "@/content/articles/types";

type ArticleCardProps = {
  article: Article;
  content: ArticlePageContent;
};

export default function ArticleCard({ article, content }: ArticleCardProps) {
  const coverImage = getAvailableLocalArticleImage(article.coverImage?.src);
  const category =
    article.category === null
      ? content.categoryFallback
      : ARTICLE_CATEGORY_LABELS[article.category][article.language];
  const publishedAt = formatArticleDate(article.publishedAt, content);
  const updatedAt = formatArticleDate(article.updatedAt, content);
  const href = getArticlePath(article.slug, article.language);

  return (
    <article className="group overflow-hidden rounded-sm border border-border bg-surface/75 transition-colors hover:border-[var(--accent-border-hover)] motion-reduce:transition-none">
      {coverImage !== null && article.coverImage !== null && (
        <Image
          src={coverImage}
          alt={article.coverImage.alt}
          width={article.coverImage.width}
          height={article.coverImage.height}
          sizes="(min-width: 1024px) 560px, 100vw"
          className="aspect-[16/9] w-full object-cover"
        />
      )}
      <div className="p-6 sm:p-7">
        <p className="text-xs font-semibold tracking-[0.16em] text-accent-soft uppercase">
          {category}
        </p>
        <h2 className="mt-3 text-2xl leading-tight text-ivory sm:text-3xl">
          <Link
            href={href}
            aria-label={`${content.readArticle}: ${article.title}`}
            className="transition-colors group-hover:text-accent-strong motion-reduce:transition-none"
          >
            {article.title}
          </Link>
        </h2>
        <p className="mt-4 text-sm leading-7 text-muted sm:text-base">
          {article.summary}
        </p>
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
          {publishedAt !== null && (
            <span>
              {content.publishedLabel}: {publishedAt}
            </span>
          )}
          {updatedAt !== null && article.updatedAt !== article.publishedAt && (
            <span>
              {content.updatedLabel}: {updatedAt}
            </span>
          )}
        </div>
        <Link
          href={href}
          className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-accent-strong underline decoration-border underline-offset-4 transition-colors hover:text-ivory motion-reduce:transition-none"
        >
          {content.readArticle} →
        </Link>
      </div>
    </article>
  );
}
