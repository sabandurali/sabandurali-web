import type { Metadata } from "next";
import {
  createPublicPageMetadata,
  homePagePaths,
} from "@/content/pages/page-seo";
import type { PublicPage } from "@/content/pages/public-types";
import { createPageMetadata, type SiteLocale } from "@/lib/metadata";

/** Static home titles and descriptions, used when no CMS home is served. */
export const staticHomeSeo = {
  tr: {
    title: "Şaban Durali | Araştırma ve Bilgi Platformu",
    description:
      "Gayrimenkul, danışmanlık, araştırma ve teknoloji alanlarında güvenilir bilgi, uygulanabilir analiz ve sürdürülebilir değer üreten bağımsız platform.",
  },
  en: {
    title: "Şaban Durali | Research and Knowledge Platform",
    description:
      "An independent platform producing reliable knowledge, actionable analysis and sustainable value across real estate, consulting, research and technology.",
  },
} as const satisfies Record<SiteLocale, { title: string; description: string }>;

function otherLocale(locale: SiteLocale): SiteLocale {
  return locale === "tr" ? "en" : "tr";
}

/**
 * Metadata of a home page ('/' or '/en'). Both home pages always exist (a
 * missing CMS home falls back to the static one), so each lists the other
 * as its translation: canonical, hreflang pair with x-default, Open Graph
 * and Twitter tags come from the shared builder. A CMS home served for the
 * same locale supplies its own SEO title, description, social image and
 * robots values.
 */
export function createHomeMetadata(
  locale: SiteLocale,
  page: PublicPage | null,
): Metadata {
  if (page !== null && page.language === locale && page.pageType === "home") {
    return createPublicPageMetadata(page);
  }

  return createPageMetadata({
    ...staticHomeSeo[locale],
    locale,
    path: homePagePaths[locale],
    translations: { [otherLocale(locale)]: homePagePaths[otherLocale(locale)] },
  });
}
