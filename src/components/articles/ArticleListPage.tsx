import ArticleCard from "@/components/articles/ArticleCard";
import PageIntro from "@/components/pages/PageIntro";
import PublicationShell from "@/components/pages/PublicationShell";
import { publicationCopy } from "@/components/pages/publication-copy";
import EmptyState from "@/components/ui/EmptyState";
import Section from "@/components/ui/Section";
import { articleListPaths } from "@/content/articles/article-routes";
import { articlePageContent } from "@/content/articles/article-page-content";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import type { ArticleLanguage } from "@/content/articles/types";

type ArticleListPageProps = {
  articles: ReadonlyArray<PublicArticleSummary>;
  locale: ArticleLanguage;
};

/**
 * Article list: intro with the article count, then every published
 * article as a card grid on the band ground, newest first. The list is
 * prerendered whole (no query string), so it stays one cached page.
 */
export default function ArticleListPage({
  articles,
  locale,
}: ArticleListPageProps) {
  const content = articlePageContent[locale];
  const copy = publicationCopy[locale];

  return (
    <PublicationShell locale={locale} languageHrefs={articleListPaths}>
      <PageIntro
        locale={locale}
        breadcrumb={[
          { label: copy.home, href: copy.homePath },
          { label: content.listTitle },
        ]}
        eyebrow={content.listEyebrow}
        title={content.listTitle}
        lead={content.listDescription}
      >
        {articles.length > 0 ? (
          <p className="m-0 type-data-md text-ink-muted">
            {copy.articleCount(articles.length)}
          </p>
        ) : null}
      </PageIntro>

      <Section
        tone="band"
        spacing="compact"
        divider
        labelledBy="article-list-heading"
      >
        <h2 id="article-list-heading" className="m-0 mb-6 type-h2">
          {copy.allArticles}
        </h2>
        {articles.length === 0 ? (
          <EmptyState size="lg">{content.emptyList}</EmptyState>
        ) : (
          <ul className="m-0 grid list-none gap-5 p-0 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article) => (
              <li key={article.id} className="grid">
                <ArticleCard
                  article={article}
                  content={content}
                  headingLevel="h3"
                  compact
                />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </PublicationShell>
  );
}
