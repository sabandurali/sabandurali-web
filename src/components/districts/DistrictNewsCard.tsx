import Image from "next/image";
import { cardFrameClassName } from "@/components/ui/Card";
import { cx } from "@/components/ui/cx";
import { Figure } from "@/components/ui/Figure";
import TextLink from "@/components/ui/TextLink";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import { formatDate, toDateTimeAttribute } from "@/lib/format-date";
import { categoryLabel } from "./district-guide-model";

/**
 * One district news item: category, title, the original short summary,
 * date and source, and a link to the source. News without a source is not
 * shown (the CMS requires one; this is defence in depth).
 */
export default function DistrictNewsCard({
  news,
  headingLevel = 2,
}: {
  news: PublicArticleSummary;
  headingLevel?: 2 | 3;
}) {
  const source = news.externalSource;
  if (source === null) return null;
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const date = formatDate(news.publishedAt);
  const dateTime = toDateTimeAttribute(news.publishedAt);

  return (
    <article className={cx(cardFrameClassName, "overflow-hidden")}>
      {news.featuredImage !== null ? (
        <Figure
          credit={
            news.featuredImage.credit
              ? { collection: news.featuredImage.credit }
              : null
          }
          className="[&>figcaption]:px-[18px]"
        >
          <Image
            src={news.featuredImage.src}
            alt={news.featuredImage.alt}
            width={news.featuredImage.width ?? 960}
            height={news.featuredImage.height ?? 540}
            sizes="(max-width: 768px) 100vw, 420px"
            className="aspect-video h-auto w-full object-cover"
          />
        </Figure>
      ) : null}
      <div className="flex flex-auto flex-col gap-2.5 px-[18px] pt-[18px] pb-4">
        <p className="m-0 type-label text-ink-muted">
          {categoryLabel(news.newsCategory) ?? "Yerel gelişme"}
        </p>
        <Heading className="m-0 type-h3">{news.title}</Heading>
        <p className="m-0 type-small">{news.summary}</p>
        <p className="m-0 mt-auto type-caption text-ink-muted">
          {date ? (
            dateTime ? (
              <time dateTime={dateTime}>{date}</time>
            ) : (
              date
            )
          ) : null}
          {date ? " · " : null}
          {source.name}
        </p>
        <p className="m-0">
          <TextLink href={source.url} variant="standalone" external>
            Kaynağa git
          </TextLink>
        </p>
      </div>
    </article>
  );
}
