import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomePage from "@/components/HomePage";
import { homeUrls } from "@/config/site";
import {
  homeContent,
  type HomeContent,
} from "@/content/homeContent";
import { getTurkishHomePageData } from "@/content/pages/page-data-source";
import { createPublicPageMetadata } from "@/content/pages/page-seo";
import type {
  PublicHeroBlock,
  PublicHomeAboutBlock,
  PublicHomeFocusAreasBlock,
  PublicPage,
} from "@/content/pages/public-types";

const staticMetadata: Metadata = {
  title: "Şaban Durali | Araştırma ve Bilgi Platformu",
  description:
    "Gayrimenkul, danışmanlık, araştırma ve teknoloji alanlarında güvenilir bilgi, uygulanabilir analiz ve sürdürülebilir değer üreten bağımsız platform.",
  alternates: {
    canonical: homeUrls["tr-TR"],
    languages: homeUrls,
  },
  openGraph: {
    title: "Şaban Durali | Araştırma ve Bilgi Platformu",
    description:
      "Gayrimenkul, danışmanlık, araştırma ve teknoloji alanlarında güvenilir bilgi, uygulanabilir analiz ve sürdürülebilir değer üreten bağımsız platform.",
    url: homeUrls["tr-TR"],
    locale: "tr_TR",
    alternateLocale: "en_US",
    type: "website",
    siteName: "Şaban Durali",
  },
};

function getPayloadHomeContent(page: PublicPage): HomeContent | null {
  const homeSections = page.layout.filter(
    (
      block,
    ): block is
      | PublicHeroBlock
      | PublicHomeAboutBlock
      | PublicHomeFocusAreasBlock =>
      block.visible &&
      (block.blockType === "hero" ||
        block.blockType === "homeAbout" ||
        block.blockType === "homeFocusAreas"),
  );
  const heroes = homeSections.filter(
    (block): block is PublicHeroBlock => block.blockType === "hero",
  );
  const aboutSections = homeSections.filter(
    (block): block is PublicHomeAboutBlock =>
      block.blockType === "homeAbout",
  );
  const focusAreaSections = homeSections.filter(
    (block): block is PublicHomeFocusAreasBlock =>
      block.blockType === "homeFocusAreas",
  );

  if (
    homeSections.length !== 3 ||
    heroes.length !== 1 ||
    aboutSections.length !== 1 ||
    focusAreaSections.length !== 1
  ) {
    return null;
  }

  const hero = heroes[0];
  const about = aboutSections[0];
  const focusAreas = focusAreaSections[0];

  return {
    ...homeContent.tr,
    hero: {
      ...homeContent.tr.hero,
      eyebrow: hero.eyebrow ?? "",
      titleLines: hero.titleLines,
      description: hero.description,
      primaryAction: hero.primaryAction.label,
      primaryActionHref: hero.primaryAction.href,
      secondaryAction: hero.secondaryAction.label,
      secondaryActionHref: hero.secondaryAction.href,
    },
    about: {
      label: about.eyebrow,
      titleLines: about.titleLines,
      paragraphs: about.paragraphs,
      imageAlt: about.imageAlt,
      ...(about.image === null ? {} : { imageSrc: about.image.src }),
      ...(about.link === null
        ? {}
        : {
            linkLabel: about.link.label,
            linkHref: about.link.href,
          }),
    },
    focusAreas: {
      label: focusAreas.eyebrow,
      title: focusAreas.title,
      ...(focusAreas.description === null
        ? {}
        : { description: focusAreas.description }),
      cards: focusAreas.cards.map((card) => ({
        icon: card.icon,
        title: card.title,
        description: card.description,
        linkLabel: card.linkLabel,
        ...(card.linkHref === null ? {} : { linkHref: card.linkHref }),
      })),
    },
    sectionOrder: homeSections.map((section) => {
      switch (section.blockType) {
        case "hero":
          return "hero";
        case "homeAbout":
          return "about";
        case "homeFocusAreas":
          return "focusAreas";
      }
    }),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getTurkishHomePageData();

  if (data.source === "static") return staticMetadata;

  return data.page === null
    ? {
        title: "Ana sayfa bulunamadı | Şaban Durali",
        robots: { index: false, follow: false },
      }
    : createPublicPageMetadata(data.page);
}

export default async function Home() {
  const data = await getTurkishHomePageData();

  if (data.source === "static") {
    return <HomePage content={homeContent.tr} />;
  }

  if (data.page === null) notFound();

  const content = getPayloadHomeContent(data.page);

  if (content === null) notFound();

  return <HomePage content={content} />;
}
