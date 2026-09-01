import Image from "next/image";
import Link from "next/link";
import { getAvailablePublicArticleImage } from "@/content/articles/article-images";
import {
  formatArticleDate,
  type ArticlePageContent,
} from "@/content/articles/article-page-content";
import { getArticlePath } from "@/content/articles/article-routes";
import type { PublicArticleSummary } from "@/content/articles/public-types";

type ArticleCardProps = {
  article: PublicArticleSummary;
  content: ArticlePageContent;
  headingLevel?: "h2" | "h3";
  compact?: boolean;
};

export default function ArticleCard({
  article,
  content,
  headingLevel = "h2",
  compact = false,
}: ArticleCardProps) {
  const Heading = headingLevel;
  const coverImage = getAvailablePublicArticleImage(article.featuredImage);
  const category = article.categories[0]?.name ?? content.categoryFallback;
  const publishedAt = formatArticleDate(article.publishedAt, content);
  const updatedAt = formatArticleDate(article.updatedAt, content);
  const href = getArticlePath(article.slug, article.language);

  return (
    <article className={`group overflow-hidden border bg-surface/75 transition-colors hover:border-[var(--accent-border-hover)] motion-reduce:transition-none ${compact ? "border-[var(--accent-border-soft)]" : "border-border"}`}>
      {coverImage !== null && article.featuredImage !== null && (
        article.featuredImage.width !== undefined &&
        article.featuredImage.height !== undefined ? (
          <Image
            src={coverImage}
            alt={article.featuredImage.alt}
            width={article.featuredImage.width}
            height={article.featuredImage.height}
            sizes="(min-width: 1024px) 560px, 100vw"
            className={`${compact ? "aspect-[4/3]" : "aspect-[16/9]"} w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none`}
          />
        ) : (
          <div className={`relative w-full ${compact ? "aspect-[4/3]" : "aspect-[16/9]"}`}>
            <Image
              src={coverImage}
              alt={article.featuredImage.alt}
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
            />
          </div>
        )
      )}
      <div className={compact ? "p-4" : "p-6 sm:p-7"}>
        <p className={`${compact ? "text-[9px]" : "text-xs"} font-semibold tracking-[0.16em] text-accent-soft uppercase`}>
          {category}
        </p>
        <Heading className={compact ? "mt-2 line-clamp-3 font-serif text-lg leading-tight text-ivory" : "mt-3 text-2xl leading-tight text-ivory sm:text-3xl"}>
          <Link
            href={href}
            aria-label={`${content.readArticle}: ${article.title}`}
            className="transition-colors group-hover:text-accent-strong motion-reduce:transition-none"
          >
            {article.title}
          </Link>
        </Heading>
        <p className={compact ? "mt-2 line-clamp-2 text-[10px] leading-4 text-muted" : "mt-4 text-sm leading-7 text-muted sm:text-base"}>
          {article.summary}
        </p>
        <div className={`${compact ? "mt-3 gap-x-2 text-[9px]" : "mt-6 gap-x-5 text-xs"} flex flex-wrap gap-y-2 text-muted`}>
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
          className={compact ? "mt-3 inline-flex min-h-8 items-center text-[10px] font-semibold text-accent-strong transition-colors hover:text-ivory" : "mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-accent-strong underline decoration-border underline-offset-4 transition-colors hover:text-ivory motion-reduce:transition-none"}
        >
          {content.readArticle} →
        </Link>
      </div>
    </article>
  );
}
