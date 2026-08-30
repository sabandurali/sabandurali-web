import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/layout/BackToTop";
import ArticleCard from "@/components/articles/ArticleCard";
import BookReviewCard from "@/components/books/BookReviewCard";
import PhotoCard from "@/components/photos/PhotoCard";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import FocusAreas from "@/components/sections/FocusAreas";
import WorkspaceQuickAccess from "@/components/sections/WorkspaceQuickAccess";
import ContactCallToAction from "@/components/sections/ContactCallToAction";
import HomeListingSection from "@/components/sections/HomeListingSection";
import { contactPaths } from "@/config/site";
import { getAllPublishedArticles } from "@/content/articles/article-data-source";
import { articlePageContent } from "@/content/articles/article-page-content";
import { articleListPaths } from "@/content/articles/article-routes";
import { getAllPublishedBookReviews } from "@/content/books/book-data-source";
import { bookPageContent } from "@/content/books/book-page-content";
import { bookListPaths } from "@/content/books/book-routes";
import type { HomeContent } from "@/content/homeContent";
import {
  createHomeEntityJsonLd,
  serializeJsonLd,
} from "@/content/entity-seo";
import { getAllPublishedPhotos } from "@/content/photos/photo-data-source";
import { photoListPaths } from "@/content/photos/photo-routes";

function newestPublicationFirst(
  left: { publishedAt: string | null },
  right: { publishedAt: string | null },
): number {
  const leftTime = left.publishedAt === null ? 0 : Date.parse(left.publishedAt);
  const rightTime = right.publishedAt === null ? 0 : Date.parse(right.publishedAt);

  return (Number.isFinite(rightTime) ? rightTime : 0) -
    (Number.isFinite(leftTime) ? leftTime : 0);
}

export default async function HomePage({ content }: { content: HomeContent }) {
  const locale = content.locale;
  const [publishedArticles, publishedBookReviews, publishedPhotos] =
    await Promise.all([
      getAllPublishedArticles(locale),
      getAllPublishedBookReviews(locale),
      getAllPublishedPhotos(locale),
    ]);
  const latestArticles = publishedArticles
    .toSorted(newestPublicationFirst)
    .slice(0, 3);
  const latestBookReviews = publishedBookReviews
    .toSorted(newestPublicationFirst)
    .slice(0, 3);
  const latestPhotos = publishedPhotos
    .toSorted(newestPublicationFirst)
    .slice(0, 6);

  return (
    <div id="top" lang={content.locale}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(createHomeEntityJsonLd(content.locale)),
        }}
      />
      <Header
        locale={content.locale}
        anchors={content.anchors}
        content={content.header}
      />
      <main>
        <Hero anchors={content.anchors} content={content.hero} />
        <WorkspaceQuickAccess content={content.focusAreas} />
        <FocusAreas id={content.anchors.work} content={content.focusAreas} />
        <About id={content.anchors.about} content={content.about} />

        {latestArticles.length > 0 && (
          <HomeListingSection
            content={content.listingSections.articles}
            href={articleListPaths[locale]}
          >
            <div className="grid gap-6 lg:grid-cols-3">
              {latestArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  content={articlePageContent[locale]}
                  headingLevel="h3"
                />
              ))}
            </div>
          </HomeListingSection>
        )}

        {latestBookReviews.length > 0 && (
          <HomeListingSection
            content={content.listingSections.books}
            href={bookListPaths[locale]}
            tone="soft"
          >
            <div className="grid gap-6 lg:grid-cols-3">
              {latestBookReviews.map((bookReview) => (
                <BookReviewCard
                  key={bookReview.id}
                  bookReview={bookReview}
                  content={bookPageContent[locale]}
                  headingLevel="h3"
                />
              ))}
            </div>
          </HomeListingSection>
        )}

        <HomeListingSection
          content={content.listingSections.photography}
          href={photoListPaths[locale]}
          tone="light"
          compact={latestPhotos.length === 0}
        >
          {latestPhotos.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latestPhotos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  headingLevel="h3"
                />
              ))}
            </div>
          ) : (
            <div className="max-w-2xl border-l border-[var(--accent-border-soft)] pl-5 text-base leading-7 text-muted-dark">
              <p>
                {locale === "tr"
                  ? "İstanbul, şehir, mimari, sokak, hayvanlar ve doğa odaklı fotoğraf arşivi."
                  : "A photography archive focused on Istanbul, city life, architecture, streets, animals and nature."}
              </p>
              <p className="mt-3 text-sm">
                {locale === "tr"
                  ? "Yeni çalışmalar eklendikçe burada yer alacak."
                  : "New work will appear here as it is published."}
              </p>
            </div>
          )}
        </HomeListingSection>

        <ContactCallToAction
          content={content.contactCallToAction}
          href={contactPaths[locale]}
        />
      </main>
      <Footer id={content.anchors.contact} content={content.footer} />
      <BackToTop label={content.backToTopLabel} />
    </div>
  );
}
