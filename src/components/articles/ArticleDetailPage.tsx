import Image from "next/image";
import Link from "next/link";
import ArticleContent from "@/components/articles/ArticleContent";
import BackToTop from "@/components/layout/BackToTop";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { getAvailablePublicArticleImage } from "@/content/articles/article-images";
import {
  getSafeArticleHref,
} from "@/content/articles/article-links";
import {
  articlePageContent,
  formatArticleDate,
} from "@/content/articles/article-page-content";
import {
  articleListPaths,
  getArticleLanguagePaths,
  getArticlePath,
} from "@/content/articles/article-routes";
import { serializeArticleJsonLd } from "@/content/articles/article-seo";
import type {
  PublicArticle,
  PublicArticleTranslation,
} from "@/content/articles/public-types";
import { homeContent } from "@/content/homeContent";

type ArticleDetailPageProps = {
  article: PublicArticle;
  translation: PublicArticleTranslation | null;
};

export default function ArticleDetailPage({
  article,
  translation,
}: ArticleDetailPageProps) {
  const content = articlePageContent[article.language];
  const home = homeContent[article.language];
  const homePath = article.language === "tr" ? "/" : "/en";
  const category = article.categories[0]?.name ?? content.categoryFallback;
  const publishedAt = formatArticleDate(article.publishedAt, content);
  const updatedAt = formatArticleDate(article.updatedAt, content);
  const coverImage = getAvailablePublicArticleImage(article.featuredImage);
  const staticDetails =
    article.content.source === "static" ? article.content.details : null;
  const visibleFaq =
    staticDetails?.faq
      .filter((faq) => faq.visible)
      .toSorted((left, right) => left.order - right.order) ?? [];

  return (
    <div id="top" lang={article.language}>
      <Header
        locale={article.language}
        anchors={home.anchors}
        content={home.header}
        homeHref={homePath}
        anchorPrefix={homePath}
        languageHrefs={getArticleLanguagePaths(article, translation)}
      />
      <main className="px-4 py-10 sm:px-6 sm:py-14 lg:py-18">
        <article className="mx-auto max-w-4xl">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: serializeArticleJsonLd(article),
            }}
          />

          <nav aria-label={content.backToArticles} className="mb-8">
            <Link
              href={articleListPaths[article.language]}
              className="inline-flex min-h-11 items-center text-sm text-accent-soft underline decoration-border underline-offset-4 hover:text-accent-strong"
            >
              ← {content.backToArticles}
            </Link>
          </nav>

          <header className="border-b border-border pb-9 sm:pb-12">
            <p className="text-xs font-semibold tracking-[0.18em] text-accent-soft uppercase">
              {category}
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl leading-[1.08] text-ivory sm:text-5xl lg:text-6xl">
              {article.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted sm:text-xl sm:leading-9">
              {article.summary}
            </p>

            <dl className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-sm text-muted">
              {publishedAt !== null && (
                <div className="flex gap-2">
                  <dt className="font-semibold text-ivory">
                    {content.publishedLabel}:
                  </dt>
                  <dd>{publishedAt}</dd>
                </div>
              )}
              {updatedAt !== null && (
                <div className="flex gap-2">
                  <dt className="font-semibold text-ivory">
                    {content.updatedLabel}:
                  </dt>
                  <dd>{updatedAt}</dd>
                </div>
              )}
              {staticDetails?.author !== null &&
                staticDetails?.author !== undefined && (
                <div className="flex gap-2">
                  <dt className="font-semibold text-ivory">
                    {content.authorLabel}:
                  </dt>
                  <dd>{staticDetails.author.name}</dd>
                </div>
              )}
            </dl>

            {translation !== null && (
              <Link
                href={getArticlePath(
                  translation.slug,
                  translation.language,
                )}
                aria-label={content.translationAriaLabel}
                className="mt-7 inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold text-accent-strong transition-colors hover:border-accent hover:text-ivory"
              >
                {content.translationLabel} →
              </Link>
            )}
          </header>

          {coverImage !== null && article.featuredImage !== null && (
            <figure className="mt-10 sm:mt-12">
              {article.featuredImage.width !== undefined &&
              article.featuredImage.height !== undefined ? (
                <Image
                  src={coverImage}
                  alt={article.featuredImage.alt}
                  width={article.featuredImage.width}
                  height={article.featuredImage.height}
                  sizes="(min-width: 1024px) 896px, 100vw"
                  priority
                  className="h-auto w-full rounded-sm border border-border object-cover"
                />
              ) : (
                <span className="relative block aspect-video overflow-hidden rounded-sm border border-border">
                  <Image
                    src={coverImage}
                    alt={article.featuredImage.alt}
                    fill
                    sizes="(min-width: 1024px) 896px, 100vw"
                    priority
                    className="object-cover"
                  />
                </span>
              )}
              {article.featuredImage.caption && (
                <figcaption className="mt-3 text-sm text-muted">
                  {article.featuredImage.caption}
                </figcaption>
              )}
            </figure>
          )}

          <div className="mx-auto mt-10 max-w-3xl sm:mt-14">
            <ArticleContent article={article} content={content} />

            {staticDetails !== null && staticDetails.sources.length > 0 && (
              <section
                id="article-sources"
                aria-labelledby="article-sources-heading"
                className="mt-14 border-t border-border pt-10 sm:mt-18"
              >
                <h2 id="article-sources-heading" className="text-3xl text-ivory">
                  {content.sourcesTitle}
                </h2>
                <ol className="mt-6 space-y-5">
                  {staticDetails.sources.map((source) => {
                    const sourceUrl = getSafeArticleHref(source.url, false);
                    const sourcePublishedAt = formatArticleDate(
                      source.publishedAt,
                      content,
                    );
                    const sourceAccessedAt = formatArticleDate(
                      source.accessedAt,
                      content,
                    );

                    return (
                      <li
                        key={source.id}
                        id={`source-${source.id}`}
                        className="rounded-sm border border-border bg-surface p-5 sm:p-6"
                      >
                        <h3 className="text-xl text-ivory">{source.title}</h3>
                        <dl className="mt-3 space-y-1 text-sm leading-6 text-muted">
                          <div>
                            <dt className="inline font-semibold text-ivory">
                              {content.sourceAuthorLabel}: {" "}
                            </dt>
                            <dd className="inline">
                              {source.authorOrInstitution}
                            </dd>
                          </div>
                          <div>
                            <dt className="inline font-semibold text-ivory">
                              {content.sourceTypeLabel}: {" "}
                            </dt>
                            <dd className="inline">
                              {content.sourceTypeLabels[source.sourceType]}
                            </dd>
                          </div>
                          {sourcePublishedAt !== null && (
                            <div>
                              <dt className="inline font-semibold text-ivory">
                                {content.sourcePublishedLabel}: {" "}
                              </dt>
                              <dd className="inline">{sourcePublishedAt}</dd>
                            </div>
                          )}
                          {sourceAccessedAt !== null && (
                            <div>
                              <dt className="inline font-semibold text-ivory">
                                {content.sourceAccessedLabel}: {" "}
                              </dt>
                              <dd className="inline">{sourceAccessedAt}</dd>
                            </div>
                          )}
                        </dl>
                        {sourceUrl !== null && (
                          <a
                            href={sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-accent-strong underline decoration-border underline-offset-4 hover:text-ivory"
                          >
                            {content.sourceLinkLabel} ↗
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {visibleFaq.length > 0 && (
              <section
                id="article-faq"
                aria-labelledby="article-faq-heading"
                className="mt-14 border-t border-border pt-10 sm:mt-18"
              >
                <h2 id="article-faq-heading" className="text-3xl text-ivory">
                  {content.faqTitle}
                </h2>
                <div className="mt-6 space-y-3">
                  {visibleFaq.map((faq) => (
                    <details
                      key={faq.id}
                      id={`faq-${faq.id}`}
                      className="rounded-sm border border-border bg-surface p-5 open:border-accent"
                    >
                      <summary className="cursor-pointer font-serif text-lg text-ivory marker:text-accent">
                        {faq.question}
                      </summary>
                      <p className="mt-4 leading-7 text-muted">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {staticDetails?.legalNotice?.text && (
              <section
                aria-labelledby="article-legal-notice-heading"
                className="mt-14 rounded-sm border border-accent bg-[var(--accent-hero-glow)] p-5 sm:p-6"
              >
                <h2
                  id="article-legal-notice-heading"
                  className="text-xl text-ivory"
                >
                  {content.legalNoticeTitle}
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted">
                  {staticDetails.legalNotice.text}
                </p>
              </section>
            )}
          </div>
        </article>
      </main>
      <Footer id={home.anchors.contact} content={home.footer} />
      <BackToTop label={home.backToTopLabel} />
    </div>
  );
}
