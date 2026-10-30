import { getArticleOutline } from "@/components/articles/article-outline";
import DownloadLink from "@/components/articles/DownloadLink";
import PayloadRichText, {
  richTextClassName,
} from "@/components/articles/PayloadRichText";
import {
  altLanguageAttribute,
  creditFromImage,
  PublicationImage,
} from "@/components/pages/publication-media";
import { publicationCopy } from "@/components/pages/publication-copy";
import { ButtonLink } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { Figure } from "@/components/ui/Figure";
import { AlertIcon, InfoIcon } from "@/components/ui/icons";
import TextLink from "@/components/ui/TextLink";
import { getAvailableLocalArticleImage } from "@/content/articles/article-images";
import {
  isExternalArticleHref,
  getSafeArticleHref,
} from "@/content/articles/article-links";
import type { ArticlePageContent } from "@/content/articles/article-page-content";
import type {
  ArticleContentBlock,
  ArticleFaq,
  ArticleSource,
  CoverImage,
} from "@/content/articles/types";
import type { PublicArticle } from "@/content/articles/public-types";

type ArticleContentProps = {
  article: PublicArticle;
  content: ArticlePageContent;
};

type StaticArticleDetails = Extract<
  PublicArticle["content"],
  { source: "static" }
>["details"];

/** Anchor of a static article's source entry ("#source-<id>"). */
export function articleSourceAnchorId(sourceId: string): string {
  return `source-${sourceId}`;
}

/** Anchor of a static article's FAQ entry ("#faq-<id>"). */
export function articleFaqAnchorId(faqId: string): string {
  return `faq-${faqId}`;
}

function assertNeverBlock(block: never): never {
  throw new Error(`Unsupported article block: ${JSON.stringify(block)}`);
}

const panelClassName = "rounded-card border border-ink bg-land p-5 sm:p-6";

function ReferencedFaq({
  faqs,
  content,
}: {
  faqs: ReadonlyArray<ArticleFaq>;
  content: ArticlePageContent;
}) {
  if (faqs.length === 0) return null;

  return (
    <aside className={panelClassName}>
      <p className="m-0 type-label text-ink-muted">{content.inlineFaqLabel}</p>
      <ul className="mt-3 mb-0 flex list-none flex-col gap-1 p-0">
        {faqs.map((faq) => (
          <li key={faq.id}>
            <TextLink
              href={`#${articleFaqAnchorId(faq.id)}`}
              locale={content.locale}
            >
              {faq.question}
            </TextLink>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function ReferencedSources({
  sources,
  allSources,
  content,
}: {
  sources: ReadonlyArray<ArticleSource>;
  allSources: ReadonlyArray<ArticleSource>;
  content: ArticlePageContent;
}) {
  if (sources.length === 0) return null;

  return (
    <aside className={panelClassName}>
      <p className="m-0 type-label text-ink-muted">
        {content.inlineSourcesLabel}
      </p>
      <ul className="mt-3 mb-0 flex list-none flex-col gap-1 p-0">
        {sources.map((source) => (
          <li key={source.id} className="flex gap-2">
            <span aria-hidden="true" className="type-data text-ink-muted">
              [{allSources.indexOf(source) + 1}]
            </span>
            <TextLink
              href={`#${articleSourceAnchorId(source.id)}`}
              locale={content.locale}
            >
              {source.title}
            </TextLink>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function ArticleImage({
  image,
  src,
  sizes,
  locale,
}: {
  image: CoverImage;
  src: string;
  sizes: string;
  locale: PublicArticle["language"];
}) {
  return (
    <Figure
      caption={image.caption}
      credit={creditFromImage(image)}
      locale={locale}
    >
      <PublicationImage
        src={src}
        alt={image.alt}
        {...altLanguageAttribute(image.altLanguage, locale)}
        width={image.width}
        height={image.height}
        sizes={sizes}
        className="rounded-card"
      />
    </Figure>
  );
}

function ArticleBlock({
  block,
  details,
  content,
  headingId,
}: {
  block: ArticleContentBlock;
  details: StaticArticleDetails;
  content: ArticlePageContent;
  /** Anchor id of a heading block (getArticleOutline). */
  headingId?: string;
}) {
  const locale = content.locale;

  switch (block.type) {
    case "paragraph":
      return <p>{block.text}</p>;
    case "heading": {
      const Heading = block.level;
      return <Heading id={headingId}>{block.text}</Heading>;
    }
    case "bullet_list":
      return (
        <ul>
          {block.items.map((item, index) => (
            <li key={`${block.id}-${index}`}>{item}</li>
          ))}
        </ul>
      );
    case "numbered_list":
      return (
        <ol>
          {block.items.map((item, index) => (
            <li key={`${block.id}-${index}`}>{item}</li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <figure>
          <blockquote className="m-0">
            <p className="m-0">{block.text}</p>
          </blockquote>
          {block.attribution ? (
            <figcaption className="mt-3 pl-6 type-small text-ink-muted">
              — {block.attribution}
            </figcaption>
          ) : null}
        </figure>
      );
    case "image": {
      const src = getAvailableLocalArticleImage(block.image.src);

      return src === null ? null : (
        <ArticleImage
          image={block.image}
          src={src}
          sizes="(min-width: 768px) 720px, 100vw"
          locale={locale}
        />
      );
    }
    case "gallery": {
      const images = block.images.flatMap((image) => {
        const src = getAvailableLocalArticleImage(image.src);
        return src === null ? [] : [{ image, src }];
      });

      return images.length === 0 ? null : (
        <div className="grid gap-6 sm:grid-cols-2">
          {images.map(({ image, src }) => (
            <ArticleImage
              key={src}
              image={image}
              src={src}
              sizes="(min-width: 640px) 360px, 100vw"
              locale={locale}
            />
          ))}
        </div>
      );
    }
    case "video": {
      const href = getSafeArticleHref(block.src);

      return (
        <div className={panelClassName}>
          <p className="m-0 type-h4">{block.title}</p>
          {block.caption ? (
            <p className="mt-2 mb-0 type-small text-ink-muted">
              {block.caption}
            </p>
          ) : null}
          {href !== null ? (
            <TextLink
              href={href}
              variant="standalone"
              newTab={isExternalArticleHref(href)}
              locale={locale}
              className="mt-2"
            >
              {content.videoLinkLabel}
            </TextLink>
          ) : null}
        </div>
      );
    }
    case "table":
      return (
        <div
          role="region"
          aria-label={block.caption ?? publicationCopy[locale].table}
          tabIndex={0}
          className="max-w-full overflow-x-auto rounded-card border border-ink bg-land"
        >
          <table className="table! w-full min-w-[32rem] border-collapse type-small">
            {block.caption ? (
              <caption className="border-b border-hairline px-4 py-3 text-left type-h4">
                {block.caption}
              </caption>
            ) : null}
            <thead>
              <tr>
                {block.headers.map((header, index) => (
                  <th key={`${block.id}-header-${index}`} scope="col">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={`${block.id}-row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${block.id}-${rowIndex}-${cellIndex}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "info_box":
    case "warning_box": {
      const warning = block.type === "warning_box";
      const Icon = warning ? AlertIcon : InfoIcon;

      return (
        <aside
          className={cx(
            "flex gap-3 rounded-card border bg-land p-5 sm:p-6",
            warning ? "border-2 border-ink" : "border-ink",
          )}
        >
          <Icon size={22} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            {block.title ? <p className="m-0 type-h4">{block.title}</p> : null}
            <p className={cx("mb-0", block.title ? "mt-2" : "mt-0")}>
              {block.text}
            </p>
          </div>
        </aside>
      );
    }
    case "statistic": {
      const sourceIndex =
        block.sourceId === undefined
          ? -1
          : details.sources.findIndex((source) => source.id === block.sourceId);

      return (
        <div className="border-t-2 border-ink pt-4">
          <p className="m-0 type-data-lg font-bold">{block.value}</p>
          <p className="mt-1 mb-0 type-small text-ink-muted">
            {block.label}
            {sourceIndex >= 0 ? (
              <>
                {" "}
                <a
                  href={`#${articleSourceAnchorId(block.sourceId ?? "")}`}
                  className="type-data text-ink underline decoration-1 underline-offset-[0.2em] hover:decoration-2"
                >
                  [{sourceIndex + 1}]
                </a>
              </>
            ) : null}
          </p>
        </div>
      );
    }
    case "download": {
      const href = getSafeArticleHref(block.href);

      return href === null ? null : (
        <DownloadLink
          href={href}
          label={block.label || content.downloadLabel}
          fileType={block.fileType}
          fileSize={block.fileSize}
          newTab={isExternalArticleHref(href)}
          locale={locale}
        />
      );
    }
    case "button": {
      const href = getSafeArticleHref(block.href);

      return href === null ? null : (
        <ButtonLink
          href={href}
          variant={block.variant === "secondary" ? "secondary" : "primary"}
        >
          {block.label}
        </ButtonLink>
      );
    }
    case "divider":
      return <hr />;
    case "faq":
      return (
        <ReferencedFaq
          faqs={details.faq
            .filter((faq) => block.faqIds.includes(faq.id) && faq.visible)
            .toSorted((left, right) => left.order - right.order)}
          content={content}
        />
      );
    case "sources":
      return (
        <ReferencedSources
          sources={details.sources.filter((source) =>
            block.sourceIds.includes(source.id),
          )}
          allSources={details.sources}
          content={content}
        />
      );
    default:
      return assertNeverBlock(block);
  }
}

/**
 * Body of an article in the reading column. CMS articles render their
 * Lexical rich text; repository fixtures render their typed blocks with the
 * same reading styles (richTextClassName), so both look alike. Headings
 * carry the anchor ids of getArticleOutline(), the ids ArticleToc links to.
 */
export default function ArticleContent({
  article,
  content,
}: ArticleContentProps) {
  const { anchors } = getArticleOutline(article.content);

  if (article.content.source === "lexical") {
    if (article.content.data === null || article.content.data === undefined)
      return null;
    return (
      <PayloadRichText
        data={article.content.data}
        locale={article.language}
        headingIds={anchors}
      />
    );
  }

  const { blocks, details } = article.content;

  return (
    <div className={richTextClassName}>
      {blocks.map((block) => (
        <ArticleBlock
          key={block.id}
          block={block}
          details={details}
          content={content}
          headingId={anchors.get(block.id)}
        />
      ))}
    </div>
  );
}
