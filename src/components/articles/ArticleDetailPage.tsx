import { getArticleMetaItems } from "@/components/articles/article-meta";
import {
  getArticleOutline,
  getTocEntries,
} from "@/components/articles/article-outline";
import ArticleToc from "@/components/articles/ArticleToc";
import ArticleContent, {
  articleFaqAnchorId,
  articleSourceAnchorId,
} from "@/components/articles/ArticleContent";
import MetaList, { type MetaItem } from "@/components/pages/MetaList";
import PageIntro from "@/components/ui/PageIntro";
import PublicationShell from "@/components/pages/PublicationShell";
import { publicationCopy } from "@/components/pages/publication-copy";
import {
  altLanguageAttribute,
  creditFromText,
  PublicationImage,
} from "@/components/pages/publication-media";
import TranslationLink from "@/components/pages/TranslationLink";
import Container from "@/components/ui/Container";
import { Figure } from "@/components/ui/Figure";
import { ChevronDownIcon } from "@/components/ui/icons";
import Section from "@/components/ui/Section";
import TextLink from "@/components/ui/TextLink";
import { getAvailablePublicArticleImage } from "@/content/articles/article-images";
import { getSafeArticleHref } from "@/content/articles/article-links";
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
import { toDateTimeAttribute } from "@/lib/format-date";

type ArticleDetailPageProps = {
  article: PublicArticle;
  translation: PublicArticleTranslation | null;
};

type StaticDetails = Extract<
  PublicArticle["content"],
  { source: "static" }
>["details"];

function ArticleSources({
  details,
  article,
}: {
  details: StaticDetails;
  article: PublicArticle;
}) {
  const content = articlePageContent[article.language];
  if (details.sources.length === 0) return null;

  return (
    <section
      id="article-sources"
      aria-labelledby="article-sources-heading"
      className="mt-14 border-t-2 border-ink pt-8"
    >
      <h2 id="article-sources-heading" className="m-0 type-h2">
        {content.sourcesTitle}
      </h2>
      <ol className="mt-6 mb-0 flex list-none flex-col gap-0 p-0">
        {details.sources.map((source, index) => {
          const sourceUrl = getSafeArticleHref(source.url, false);
          const published = formatArticleDate(source.publishedAt, content);
          const accessed = formatArticleDate(source.accessedAt, content);
          const facts: MetaItem[] = [
            {
              label: content.sourceAuthorLabel,
              value: source.authorOrInstitution,
            },
            {
              label: content.sourceTypeLabel,
              value: content.sourceTypeLabels[source.sourceType],
            },
          ];
          if (published !== null) {
            facts.push({
              label: content.sourcePublishedLabel,
              value: published,
              dateTime: toDateTimeAttribute(source.publishedAt),
              data: true,
            });
          }
          if (accessed !== null) {
            facts.push({
              label: content.sourceAccessedLabel,
              value: accessed,
              dateTime: toDateTimeAttribute(source.accessedAt),
              data: true,
            });
          }

          return (
            <li
              key={source.id}
              id={articleSourceAnchorId(source.id)}
              className="grid scroll-mt-24 gap-x-4 border-b border-hairline py-5 target:bg-land sm:grid-cols-[3.5rem_minmax(0,1fr)]"
            >
              <span className="type-data-md font-bold text-ink-muted">
                [{index + 1}]
              </span>
              <div className="min-w-0">
                <h3 className="m-0 type-h4">{source.title}</h3>
                <MetaList items={facts} className="mt-3" />
                {sourceUrl !== null ? (
                  <TextLink
                    href={sourceUrl}
                    variant="standalone"
                    newTab
                    locale={article.language}
                    className="mt-1"
                  >
                    {content.sourceLinkLabel}
                  </TextLink>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function ArticleFaq({
  details,
  article,
}: {
  details: StaticDetails;
  article: PublicArticle;
}) {
  const content = articlePageContent[article.language];
  const visibleFaq = details.faq
    .filter((faq) => faq.visible)
    .toSorted((left, right) => left.order - right.order);
  if (visibleFaq.length === 0) return null;

  return (
    <section
      id="article-faq"
      aria-labelledby="article-faq-heading"
      className="mt-14 border-t-2 border-ink pt-8"
    >
      <h2 id="article-faq-heading" className="m-0 type-h2">
        {content.faqTitle}
      </h2>
      <div className="mt-6 flex flex-col gap-3">
        {visibleFaq.map((faq) => (
          <details
            key={faq.id}
            id={articleFaqAnchorId(faq.id)}
            className="group scroll-mt-24 rounded-card border border-ink bg-land"
          >
            <summary className="flex min-h-tap cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 type-h4 [&::-webkit-details-marker]:hidden">
              <span>{faq.question}</span>
              <ChevronDownIcon
                size={20}
                className="shrink-0 transition-transform duration-150 ease-atlas group-open:rotate-180"
              />
            </summary>
            <p className="m-0 border-t border-hairline px-5 py-4 type-body">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

/**
 * Article page: intro (category, title, summary, dates, translation link),
 * the featured image with its caption and credit, the body in the reading
 * column, then sources, questions and the legal notice of a static article.
 */
export default function ArticleDetailPage({
  article,
  translation,
}: ArticleDetailPageProps) {
  const locale = article.language;
  const content = articlePageContent[locale];
  const copy = publicationCopy[locale];
  const category = article.categories[0]?.name ?? content.categoryFallback;
  const coverImage = getAvailablePublicArticleImage(article.featuredImage);
  const staticDetails =
    article.content.source === "static" ? article.content.details : null;

  return (
    <PublicationShell
      locale={locale}
      languageHrefs={getArticleLanguagePaths(article, translation)}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeArticleJsonLd(article) }}
      />
      <article aria-labelledby="article-title">
        <PageIntro
          layout="page"
          locale={locale}
          breadcrumb={[
            { label: copy.home, href: copy.homePath },
            { label: content.listTitle, href: articleListPaths[locale] },
            { label: article.title },
          ]}
          eyebrow={category}
          title={article.title}
          lead={article.summary}
          titleId="article-title"
        >
          <MetaList items={getArticleMetaItems(article)} />
          {translation !== null ? (
            <TranslationLink
              href={getArticlePath(translation.slug, translation.language)}
              targetLanguage={translation.language}
              label={content.translationLabel}
              labelLanguage={locale === "tr" ? "en" : undefined}
            />
          ) : null}
        </PageIntro>

        {coverImage !== null && article.featuredImage !== null ? (
          <Container className="pb-10 sm:pb-14">
            <Figure
              caption={article.featuredImage.caption}
              credit={creditFromText(article.featuredImage.credit)}
              locale={locale}
              className="max-w-[60rem]"
            >
              <PublicationImage
                src={coverImage}
                alt={article.featuredImage.alt}
                {...altLanguageAttribute(
                  article.featuredImage.altLanguage,
                  locale,
                )}
                width={article.featuredImage.width}
                height={article.featuredImage.height}
                sizes="(min-width: 1080px) 960px, 100vw"
                preload
                className="rounded-card border border-ink"
              />
            </Figure>
          </Container>
        ) : null}

        <Section
          tone="paper"
          spacing="none"
          divider
          className="pt-10 pb-section sm:pt-14"
        >
          <div className="max-w-measure">
            <ArticleToc
              entries={getTocEntries(getArticleOutline(article.content))}
              locale={locale}
              className="mb-10"
            />
            <ArticleContent article={article} content={content} />

            {staticDetails !== null ? (
              <>
                <ArticleSources details={staticDetails} article={article} />
                <ArticleFaq details={staticDetails} article={article} />
                {staticDetails.legalNotice?.text ? (
                  <aside
                    aria-labelledby="article-legal-notice-heading"
                    className="mt-14 rounded-card border-2 border-ink bg-land p-5 sm:p-6"
                  >
                    <h2
                      id="article-legal-notice-heading"
                      className="m-0 type-h4"
                    >
                      {content.legalNoticeTitle}
                    </h2>
                    <p className="mt-2 mb-0 type-small">
                      {staticDetails.legalNotice.text}
                    </p>
                  </aside>
                ) : null}
              </>
            ) : null}

            <TextLink
              href={articleListPaths[locale]}
              variant="standalone"
              locale={locale}
              className="mt-12"
            >
              {content.backToArticles}
            </TextLink>
          </div>
        </Section>
      </article>
    </PublicationShell>
  );
}
