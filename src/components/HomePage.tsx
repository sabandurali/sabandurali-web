import Footer from "@/components/layout/Footer";
import {
  ArticleCardList,
  BookReviewCardList,
  PhotoCardList,
} from "@/components/pages/PublicationCardLists";
import BackToTop from "@/components/layout/BackToTop";
import Header from "@/components/layout/Header";
import About from "@/components/sections/About";
import ContactCallToAction from "@/components/sections/ContactCallToAction";
import { FocusAreaCards } from "@/components/sections/FocusAreas";
import Hero from "@/components/sections/Hero";
import HomeAtlas, {
  type HomeFeaturedGuide,
} from "@/components/sections/HomeAtlas";
import HomeListingSection from "@/components/sections/HomeListingSection";
import HomeSectionHeading from "@/components/sections/HomeSectionHeading";
import { homeCopy } from "@/components/sections/home-copy";
import {
  homeListLimits,
  pickFeaturedDistrict,
} from "@/components/sections/home-selection";
import { getPortraitCredit } from "@/components/sections/home-portrait";
import Section from "@/components/ui/Section";
import { contactPaths } from "@/config/site";
import { getLatestPublishedArticles } from "@/content/articles/article-data-source";
import { articleListPaths } from "@/content/articles/article-routes";
import { getLatestPublishedBookReviews } from "@/content/books/book-data-source";
import { bookListPaths } from "@/content/books/book-routes";
import { getDistrictGuideSummaries } from "@/content/districts/district-guide-data-source";
import { createHomeEntityJsonLd, serializeJsonLd } from "@/content/entity-seo";
import type { HomeContent } from "@/content/homeContent";
import { homeEditorialContent } from "@/content/homeEditorialContent";
import type { PublicPage } from "@/content/pages/public-types";
import { getHomePagePhotos } from "@/content/photos/photo-data-source";
import { photoListPaths } from "@/content/photos/photo-routes";
import { getVerifiedDistrictImage } from "@/content/photos/verified-district-images";

type HomePageProps = {
  content: HomeContent;
  /** The CMS home record behind `content`; null for the static home. */
  page?: PublicPage | null;
};

/**
 * The home page in the İstanbul Atlası design: hero, the 39-district
 * atlas with the featured guide, the latest articles, book reviews and
 * photos, the workspaces, "Hakkımda" on the sea ground and the contact
 * call to action. All content comes from the content layer; an empty list
 * shows an explicit empty state.
 */
export default async function HomePage({
  content,
  page = null,
}: HomePageProps) {
  const locale = content.locale;
  const copy = homeCopy[locale];
  // Limited reads: each list is read with a database limit (newest first;
  // Istanbul photos lead), never the whole collection (SEO-PERF-1).
  const [latestArticles, latestBooks, latestPhotos, guideSummaries] =
    await Promise.all([
      getLatestPublishedArticles(locale, homeListLimits.articles),
      getLatestPublishedBookReviews(locale, homeListLimits.books),
      getHomePagePhotos(locale, homeListLimits.photos),
      getDistrictGuideSummaries(),
    ]);

  const featuredSlug = pickFeaturedDistrict(
    guideSummaries,
    (slug) => getVerifiedDistrictImage(slug, locale) !== null,
  );
  const featured: HomeFeaturedGuide | null =
    featuredSlug === null
      ? null
      : {
          slug: featuredSlug,
          summary: guideSummaries.get(featuredSlug) ?? "",
          image: getVerifiedDistrictImage(featuredSlug, locale),
        };

  const focusAreas = content.focusAreas;
  const workspacesHeadingId = `${content.anchors.work}-baslik`;

  return (
    <div id="top">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(createHomeEntityJsonLd(locale)),
        }}
      />
      <Header
        locale={locale}
        anchors={content.anchors}
        content={content.header}
      />
      <main id="main" className="bg-paper text-ink">
        <Hero
          anchors={content.anchors}
          content={content.hero}
          factsLabel={copy.heroFactsLabel}
          featuredSlug={featured?.slug}
        />

        <HomeAtlas locale={locale} featured={featured} />

        <HomeListingSection
          id={locale === "tr" ? "son-makaleler" : "latest-articles"}
          locale={locale}
          number={copy.articles.number}
          eyebrow={copy.articles.eyebrow}
          title={content.listingSections.articles.title}
          linkLabel={content.listingSections.articles.linkLabel}
          href={articleListPaths[locale]}
          emptyMessage={copy.articles.empty}
          itemCount={latestArticles.length}
        >
          <ArticleCardList articles={latestArticles} locale={locale} />
        </HomeListingSection>

        <HomeListingSection
          id={locale === "tr" ? "kitaplar" : "books"}
          locale={locale}
          tone="band"
          number={copy.books.number}
          eyebrow={copy.books.eyebrow}
          title={content.listingSections.books.title}
          linkLabel={content.listingSections.books.linkLabel}
          href={bookListPaths[locale]}
          emptyMessage={copy.books.empty}
          itemCount={latestBooks.length}
        >
          <BookReviewCardList books={latestBooks} locale={locale} />
        </HomeListingSection>

        <HomeListingSection
          id={locale === "tr" ? "fotograf" : "photography"}
          locale={locale}
          number={copy.photos.number}
          eyebrow={copy.photos.eyebrow}
          title={content.listingSections.photography.title}
          linkLabel={content.listingSections.photography.linkLabel}
          href={photoListPaths[locale]}
          emptyMessage={copy.photos.empty}
          itemCount={latestPhotos.length}
        >
          <PhotoCardList photos={latestPhotos} columns={4} />
        </HomeListingSection>

        {focusAreas.cards.length > 0 ? (
          <Section
            id={content.anchors.work}
            tone="land"
            divider
            labelledBy={workspacesHeadingId}
          >
            <HomeSectionHeading
              id={workspacesHeadingId}
              number={copy.workspaces.number}
              eyebrow={focusAreas.label}
              title={focusAreas.title}
            >
              {focusAreas.description ? (
                <p className="m-0">{focusAreas.description}</p>
              ) : null}
            </HomeSectionHeading>
            <FocusAreaCards
              className="mt-8"
              cards={focusAreas.cards.map((card, index) => ({
                id: `${index}-${card.title}`,
                icon: card.icon,
                title: card.title,
                description: card.description,
                linkLabel: card.linkLabel,
                linkHref: card.linkHref ?? null,
              }))}
            />
          </Section>
        ) : null}

        <About
          id={content.anchors.about}
          locale={locale}
          content={content.about}
          manifestoLines={homeEditorialContent[locale].manifestoLines}
          portraitCaption={copy.about.portraitCaption}
          portraitCredit={getPortraitCredit(page, content.about)}
        />

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
