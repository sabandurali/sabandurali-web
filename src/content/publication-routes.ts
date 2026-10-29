import { getAbsoluteUrl } from "@/config/site";
import type { SiteLocale } from "@/content/locales";

/** What a route needs from an article, book review or photo: its language and slug. */
export type RoutablePublication = {
  language: SiteLocale;
  slug: string;
};

export type PublicationRoutes = {
  /** Root-relative path of one publication. */
  getPath: (slug: string, language: SiteLocale) => string;
  /** Absolute URL of one publication on the canonical site origin. */
  getUrl: (slug: string, language: SiteLocale) => string;
  /**
   * The path of the publication in each locale: its own page, its
   * translation's page, and the list page of a locale without either.
   */
  getLanguagePaths: (
    publication: RoutablePublication,
    translation: RoutablePublication | null,
  ) => Record<SiteLocale, string>;
};

/**
 * The detail routes of a publication type below its list pages
 * (`/makaleler/<slug>`, `/en/books/<slug>`, …). Articles, book reviews and
 * photos share this one implementation (ARCHITECTURE-6).
 */
export function createPublicationRoutes(
  listPaths: Readonly<Record<SiteLocale, string>>,
): PublicationRoutes {
  const getPath = (slug: string, language: SiteLocale) =>
    `${listPaths[language]}/${slug}`;

  return {
    getPath,
    getUrl: (slug, language) => getAbsoluteUrl(getPath(slug, language)),
    getLanguagePaths: (publication, translation) => {
      const paths: Record<SiteLocale, string> = {
        tr: listPaths.tr,
        en: listPaths.en,
      };
      paths[publication.language] = getPath(
        publication.slug,
        publication.language,
      );
      if (translation !== null) {
        paths[translation.language] = getPath(
          translation.slug,
          translation.language,
        );
      }
      return paths;
    },
  };
}
