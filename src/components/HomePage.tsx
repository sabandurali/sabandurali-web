import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/layout/BackToTop";
import ArticleCard from "@/components/articles/ArticleCard";
import PhotoCard from "@/components/photos/PhotoCard";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import ContactCallToAction from "@/components/sections/ContactCallToAction";
import HomeListingSection from "@/components/sections/HomeListingSection";
import { IstanbulDiscovery, KnowledgeLibrary, RealEstateIntelligence } from "@/components/sections/HomeEditorialSections";
import { contactPaths } from "@/config/site";
import { getAllPublishedArticles } from "@/content/articles/article-data-source";
import { articlePageContent } from "@/content/articles/article-page-content";
import { articleListPaths } from "@/content/articles/article-routes";
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
  const [publishedArticles, publishedPhotos] =
    await Promise.all([
      getAllPublishedArticles(locale),
      getAllPublishedPhotos(locale),
    ]);
  const latestArticles = publishedArticles
    .toSorted(newestPublicationFirst)
    .slice(0, 4);
  const latestPhotos = publishedPhotos
    .toSorted(newestPublicationFirst)
    .slice(0, 5);

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
        compact
      />
      <main>
        <Hero anchors={content.anchors} content={content.hero} />
        <IstanbulDiscovery />
        <RealEstateIntelligence />

        <HomeListingSection
          content={content.listingSections.articles}
          eyebrow="03 / Son Araştırmalar"
          href={articleListPaths[locale]}
          id="son-arastirmalar"
        >
          {latestArticles.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {latestArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  content={articlePageContent[locale]}
                  headingLevel="h3"
                  compact
                />
              ))}
            </div>
          ) : (
            <p className="flex min-h-20 items-center border border-[var(--accent-border-soft)] bg-surface px-4 py-4 text-[10px] leading-4 text-muted md:min-h-24">
              {locale === "tr"
                ? "Yayınlanmış analizler eklendikçe bu seçki burada yer alacak."
                : "Published analysis will appear here as it becomes available."}
            </p>
          )}
        </HomeListingSection>

        <KnowledgeLibrary />

        <HomeListingSection
          content={content.listingSections.photography}
          eyebrow="05 / İstanbul’u Belgeliyorum"
          href={photoListPaths[locale]}
          id="fotograf"
        >
          {latestPhotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {latestPhotos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  headingLevel="h3"
                  compact
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-28 flex-col justify-center border border-[var(--accent-border-soft)] bg-surface px-4 py-4 text-[10px] leading-4 text-muted md:min-h-32">
              <p>
                {locale === "tr"
                  ? "İstanbul, şehir, mimari, sokak, hayvanlar ve doğa odaklı fotoğraf arşivi."
                  : "A photography archive focused on Istanbul, city life, architecture, streets, animals and nature."}
              </p>
              <p className="mt-1 text-[9px]">
                {locale === "tr"
                  ? "Yeni çalışmalar eklendikçe burada yer alacak."
                  : "New work will appear here as it is published."}
              </p>
            </div>
          )}
        </HomeListingSection>

        <About id={content.anchors.about} content={content.about} compact />

        <ContactCallToAction
          content={content.contactCallToAction}
          href={contactPaths[locale]}
        />
      </main>
      <Footer id={content.anchors.contact} content={content.footer} compact />
      <BackToTop label={content.backToTopLabel} />
    </div>
  );
}
