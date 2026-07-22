import ArticleCard from "@/components/articles/ArticleCard";
import BackToTop from "@/components/layout/BackToTop";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { articleListPaths } from "@/content/articles/article-routes";
import { articlePageContent } from "@/content/articles/article-page-content";
import type {
  Article,
  ArticleLanguage,
} from "@/content/articles/types";
import { homeContent } from "@/content/homeContent";

type ArticleListPageProps = {
  articles: ReadonlyArray<Article>;
  locale: ArticleLanguage;
};

export default function ArticleListPage({
  articles,
  locale,
}: ArticleListPageProps) {
  const content = articlePageContent[locale];
  const home = homeContent[locale];
  const homePath = locale === "tr" ? "/" : "/en";

  return (
    <div id="top" lang={locale}>
      <Header
        locale={locale}
        anchors={home.anchors}
        content={home.header}
        homeHref={homePath}
        anchorPrefix={homePath}
        languageHrefs={articleListPaths}
      />
      <main className="px-4 py-14 sm:px-6 sm:py-18 lg:py-22">
        <div className="mx-auto max-w-5xl">
          <header className="mb-10 border-b border-border pb-8 sm:mb-12 sm:pb-10">
            <p className="text-xs font-semibold tracking-[0.22em] text-accent-soft">
              {content.listEyebrow}
            </p>
            <h1 className="mt-4 text-4xl leading-tight text-ivory sm:text-5xl">
              {content.listTitle}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
              {content.listDescription}
            </p>
          </header>

          {articles.length === 0 ? (
            <p className="rounded-sm border border-border bg-surface p-6 text-muted">
              {content.emptyList}
            </p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  content={content}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer id={home.anchors.contact} content={home.footer} />
      <BackToTop label={home.backToTopLabel} />
    </div>
  );
}
