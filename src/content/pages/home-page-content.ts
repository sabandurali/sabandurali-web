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
        hero.highlights.length === 0
          ? fallback.hero.goals
          : hero.highlights,
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
