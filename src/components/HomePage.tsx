import Image from "next/image";
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
import { homeEditorialContent } from "@/content/homeEditorialContent";
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
  const editorial = homeEditorialContent[locale];
  const [publishedArticles, publishedPhotos] =
    await Promise.all([
      getAllPublishedArticles(locale),
      getAllPublishedPhotos(locale),
    ]);
  const latestArticles = publishedArticles
    .toSorted(newestPublicationFirst)
    .slice(0, 4);
  const photoPriority = (photo: (typeof publishedPhotos)[number]) => photo.district || photo.districtPhotoCategory === "tarih" || photo.collections.some((collection) => /istanbul|mimari|architecture/i.test(collection.slug)) ? 1 : 0;
  const latestPhotos = publishedPhotos
    .toSorted((a, b) => photoPriority(b) - photoPriority(a) || newestPublicationFirst(a, b))
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
        <Hero
          anchors={content.anchors}
          content={content.hero}
          intelligence={editorial.heroIntelligence}
        />
        <IstanbulDiscovery content={editorial.discovery} />
        <RealEstateIntelligence content={editorial.realEstate} />

        {latestArticles.length > 0 && (
          <HomeListingSection
            content={content.listingSections.articles}
            description={locale === "tr" ? "Güncel araştırma ve analizlerden oluşan seçki." : "A selection of current research and analysis."}
            eyebrow={editorial.researchEyebrow}
            href={articleListPaths[locale]}
            id="son-arastirmalar"
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
          </HomeListingSection>
        )}

        <KnowledgeLibrary content={{ ...editorial.knowledge, eyebrow: editorial.knowledge.eyebrow.replace(/^\d+/, latestArticles.length ? "04" : "03") }} />

        <HomeListingSection
          content={content.listingSections.photography}
          description={locale === "tr" ? "İstanbul, şehir, mimari, sokak, hayvanlar ve doğa odaklı fotoğraf arşivi." : "A photography archive focused on Istanbul, city life, architecture, streets, animals and nature."}
          eyebrow={editorial.photographyEyebrow.replace(/^\d+/, latestArticles.length ? "05" : "04")}
          href={photoListPaths[locale]}
          id="fotograf"
        >
          {latestPhotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
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
            <div className="relative flex min-h-48 flex-col justify-end overflow-hidden border border-[var(--accent-border-soft)] bg-surface px-5 py-5 text-xs leading-5 text-muted md:min-h-56 md:px-8 md:py-6">
              <Image src="/workspaces/fotograf.jpg" alt="" fill sizes="(min-width: 768px) 70vw, 100vw" className="object-cover object-center opacity-45" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,12,22,0.96),rgba(5,12,22,0.35)_70%,rgba(5,12,22,0.7))]" />
              <div className="relative max-w-xl border-l border-accent-soft pl-4">
                <p className="font-serif text-xl leading-snug text-ivory md:text-2xl">
                {locale === "tr"
                  ? "İstanbul, şehir, mimari, sokak, hayvanlar ve doğa odaklı fotoğraf arşivi."
                  : "A photography archive focused on Istanbul, city life, architecture, streets, animals and nature."}
                </p>
                <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-accent-soft">
                {locale === "tr"
                  ? "Yeni çalışmalar eklendikçe burada yer alacak."
                  : "New work will appear here as it is published."}
                </p>
              </div>
            </div>
          )}
        </HomeListingSection>

        <About
          id={content.anchors.about}
          content={content.about}
          manifestoLines={editorial.manifestoLines}
          compact
        />

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
