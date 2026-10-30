import { reportContentIssue } from "@/content/content-log";
import type { HomeContent } from "@/content/homeContent";
import type {
  PublicHeroBlock,
  PublicHomeAboutBlock,
  PublicHomeFocusAreasBlock,
  PublicPage,
} from "@/content/pages/public-types";

export function getPayloadHomeContent(
  page: PublicPage,
  fallback: HomeContent,
): HomeContent | null {
  if (page.language !== fallback.locale) return null;

  const homeSections = page.layout.filter(
    (
      block,
    ): block is
      PublicHeroBlock | PublicHomeAboutBlock | PublicHomeFocusAreasBlock =>
      block.visible &&
      (block.blockType === "hero" ||
        block.blockType === "homeAbout" ||
        block.blockType === "homeFocusAreas"),
  );
  const heroes = homeSections.filter(
    (block): block is PublicHeroBlock => block.blockType === "hero",
  );
  const aboutSections = homeSections.filter(
    (block): block is PublicHomeAboutBlock => block.blockType === "homeAbout",
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
    ...fallback,
    hero: {
      ...fallback.hero,
      eyebrow: hero.eyebrow ?? "",
      titleLines: hero.titleLines,
      description: hero.description,
      primaryAction: hero.primaryAction.label,
      primaryActionHref: hero.primaryAction.href,
      secondaryAction: hero.secondaryAction.label,
      secondaryActionHref: hero.secondaryAction.href,
      goals:
        hero.highlights.length === 0 ? fallback.hero.goals : hero.highlights,
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
  };
}

/** What the home page data source returns for one locale. */
export type HomePageData =
  | {
      source: "static";
      page: null;
    }
  | {
      source: "payload";
      page: PublicPage | null;
    };

export type ResolvedHomeContent = {
  content: HomeContent;
  /** The CMS page behind `content`; null when the static content is served. */
  page: PublicPage | null;
};

/**
 * The home page never 404s. When the CMS home record is missing, unpublished,
 * scheduled or has incomplete blocks, the static home content is served and
 * the problem is logged as an error, because "/" is the most important URL of
 * the site and is prerendered at build time. The English home has no CMS
 * record by design until one is written, so its absence is only info.
 */
export function resolveHomeContent(
  data: HomePageData,
  fallback: HomeContent,
): ResolvedHomeContent {
  if (data.source === "static") return { content: fallback, page: null };

  if (data.page === null) {
    reportContentIssue(
      {
        scope: "home",
        locale: fallback.locale,
        reason: "no public CMS home page; static home content served",
      },
      fallback.locale === "en" ? "info" : "error",
    );
    return { content: fallback, page: null };
  }

  const content = getPayloadHomeContent(data.page, fallback);

  if (content === null) {
    reportContentIssue(
      {
        scope: "home",
        id: data.page.id,
        locale: fallback.locale,
        reason:
          "CMS home page blocks are incomplete; static home content served",
      },
      "error",
    );
    return { content: fallback, page: null };
  }

  return { content, page: data.page };
}
