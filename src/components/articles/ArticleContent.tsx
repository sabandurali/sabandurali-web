import Image from "next/image";
import { getAvailableLocalArticleImage } from "@/content/articles/article-images";
import {
  isExternalArticleHref,
  getSafeArticleHref,
} from "@/content/articles/article-links";
import type { ArticlePageContent } from "@/content/articles/article-page-content";
import type {
  Article,
  ArticleContentBlock,
  ArticleFaq,
  ArticleSource,
} from "@/content/articles/types";

type ArticleContentProps = {
  article: Article;
  content: ArticlePageContent;
};

function assertNeverBlock(block: never): never {
  throw new Error(`Unsupported article block: ${JSON.stringify(block)}`);
}

function getExternalLinkProps(href: string) {
  return isExternalArticleHref(href)
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};
}

function renderReferencedFaq(
  faqs: ReadonlyArray<ArticleFaq>,
  content: ArticlePageContent,
) {
  if (faqs.length === 0) {
    return null;
  }

  return (
    <aside className="rounded-sm border border-border bg-surface p-5 sm:p-6">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent-soft uppercase">
        {content.inlineFaqLabel}
      </p>
      <ul className="mt-3 space-y-2 text-sm text-ivory">
        {faqs.map((faq) => (
          <li key={faq.id}>
            <a
              href={`#faq-${faq.id}`}
              className="underline decoration-border underline-offset-4 hover:text-accent-strong"
            >
              {faq.question}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function renderReferencedSources(
  sources: ReadonlyArray<ArticleSource>,
  content: ArticlePageContent,
) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <aside className="rounded-sm border border-border bg-surface p-5 sm:p-6">
      <p className="text-xs font-semibold tracking-[0.16em] text-accent-soft uppercase">
        {content.inlineSourcesLabel}
      </p>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ivory">
        {sources.map((source) => (
          <li key={source.id}>
            <a
              href={`#source-${source.id}`}
              className="underline decoration-border underline-offset-4 hover:text-accent-strong"
            >
              {source.title}
            </a>
          </li>
        ))}
      </ol>
    </aside>
  );
}

function renderArticleBlock(
  block: ArticleContentBlock,
  article: Article,
  content: ArticlePageContent,
) {
  switch (block.type) {
    case "paragraph":
      return <p className="text-base leading-8 text-muted sm:text-lg">{block.text}</p>;
    case "heading": {
      const Heading = block.level;
      const headingClass =
        block.level === "h2"
          ? "pt-5 text-3xl leading-tight text-ivory sm:text-4xl"
          : block.level === "h3"
            ? "pt-3 text-2xl leading-tight text-ivory sm:text-3xl"
            : "pt-2 text-xl leading-tight text-ivory sm:text-2xl";

      return <Heading className={headingClass}>{block.text}</Heading>;
    }
    case "bullet_list":
      return (
        <ul className="list-disc space-y-2 pl-6 text-base leading-8 text-muted sm:text-lg">
          {block.items.map((item, index) => (
            <li key={`${block.id}-${index}`}>{item}</li>
          ))}
        </ul>
      );
    case "numbered_list":
      return (
        <ol className="list-decimal space-y-2 pl-6 text-base leading-8 text-muted sm:text-lg">
          {block.items.map((item, index) => (
            <li key={`${block.id}-${index}`}>{item}</li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote className="border-l-2 border-accent pl-5 text-lg leading-8 text-ivory italic sm:pl-7 sm:text-xl">
          <p>{block.text}</p>
          {block.attribution && (
            <footer className="mt-3 text-sm not-italic text-muted">
              — {block.attribution}
            </footer>
          )}
        </blockquote>
      );
    case "image": {
      const src = getAvailableLocalArticleImage(block.image.src);

      return src === null ? null : (
        <figure>
          <Image
            src={src}
            alt={block.image.alt}
            width={block.image.width}
            height={block.image.height}
            sizes="(min-width: 1024px) 768px, 100vw"
            className="h-auto w-full rounded-sm border border-border object-cover"
          />
          {block.image.caption && (
            <figcaption className="mt-3 text-sm text-muted">
              {block.image.caption}
            </figcaption>
          )}
        </figure>
      );
    }
    case "gallery": {
      const images = block.images
        .map((image) => ({
          image,
          src: getAvailableLocalArticleImage(image.src),
        }))
        .filter(
          (item): item is { image: typeof item.image; src: string } =>
            item.src !== null,
        );

      return images.length === 0 ? null : (
        <div className="grid gap-4 sm:grid-cols-2">
          {images.map(({ image, src }) => (
            <figure key={src}>
              <Image
                src={src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                sizes="(min-width: 640px) 380px, 100vw"
                className="h-auto w-full rounded-sm border border-border object-cover"
              />
              {image.caption && (
                <figcaption className="mt-2 text-sm text-muted">
                  {image.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      );
    }
    case "video": {
      const href = getSafeArticleHref(block.src);

      return (
        <div className="rounded-sm border border-border bg-surface p-5 sm:p-6">
          <p className="font-serif text-xl text-ivory">{block.title}</p>
          {block.caption && (
            <p className="mt-2 text-sm leading-6 text-muted">{block.caption}</p>
          )}
          {href !== null && (
            <a
              href={href}
              {...getExternalLinkProps(href)}
              className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-accent-strong underline decoration-border underline-offset-4 hover:text-ivory"
            >
              {content.videoLinkLabel} ↗
            </a>
          )}
        </div>
      );
    }
    case "table":
      return (
        <div className="overflow-x-auto rounded-sm border border-border">
          <table className="w-full min-w-xl border-collapse text-left text-sm text-muted">
            {block.caption && (
              <caption className="bg-surface p-4 text-left font-serif text-lg text-ivory">
                {block.caption}
              </caption>
            )}
            <thead className="bg-surface-soft text-ivory">
              <tr>
                {block.headers.map((header, index) => (
                  <th key={`${block.id}-header-${index}`} scope="col" className="border-b border-border p-4">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={`${block.id}-row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${block.id}-${rowIndex}-${cellIndex}`} className="border-b border-border p-4 last:border-b-0">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "info_box":
    case "warning_box":
      return (
        <aside
          className={`rounded-sm border p-5 sm:p-6 ${
            block.type === "warning_box"
              ? "border-accent bg-[var(--accent-hero-glow)]"
              : "border-border bg-surface"
          }`}
        >
          {block.title && (
            <p className="font-serif text-xl text-ivory">{block.title}</p>
          )}
          <p className={`${block.title ? "mt-2" : ""} leading-7 text-muted`}>
            {block.text}
          </p>
        </aside>
      );
    case "statistic":
      return (
        <div className="rounded-sm border border-border bg-surface p-6 text-center">
          <p className="font-serif text-4xl text-accent-strong sm:text-5xl">
            {block.value}
          </p>
          <p className="mt-2 text-sm text-muted">{block.label}</p>
        </div>
      );
    case "download": {
      const href = getSafeArticleHref(block.href);

      return href === null ? null : (
        <a
          href={href}
          {...getExternalLinkProps(href)}
          className="flex min-h-12 items-center justify-between gap-4 rounded-sm border border-border bg-surface px-5 py-3 text-sm font-semibold text-ivory hover:border-accent hover:text-accent-strong"
        >
          <span>{block.label || content.downloadLabel}</span>
          <span aria-hidden="true">↓</span>
        </a>
      );
    }
    case "button": {
      const href = getSafeArticleHref(block.href);

      return href === null ? null : (
        <a
          href={href}
          {...getExternalLinkProps(href)}
          className={`inline-flex min-h-11 items-center rounded-sm border px-5 py-3 text-sm font-semibold transition-colors ${
            block.variant === "secondary"
              ? "border-border text-ivory hover:border-accent"
              : "border-accent bg-accent text-background hover:bg-accent-strong"
          }`}
        >
          {block.label}
        </a>
      );
    }
    case "divider":
      return <hr className="border-0 border-t border-border" />;
    case "faq":
      return renderReferencedFaq(
        article.faq
          .filter((faq) => block.faqIds.includes(faq.id) && faq.visible)
          .toSorted((left, right) => left.order - right.order),
        content,
      );
    case "sources":
      return renderReferencedSources(
        article.sources.filter((source) =>
          block.sourceIds.includes(source.id),
        ),
        content,
      );
    default:
      return assertNeverBlock(block);
  }
}

export default function ArticleContent({ article, content }: ArticleContentProps) {
  return (
    <div className="space-y-7 sm:space-y-9">
      {article.content.map((block) => (
        <div key={block.id}>{renderArticleBlock(block, article, content)}</div>
      ))}
    </div>
  );
}
