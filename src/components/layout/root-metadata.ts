import type { Metadata } from "next";
import { webManifestPath } from "@/config/brand";
import { siteUrl } from "@/config/site";
import {
  defaultSocialImage,
  getOpenGraphLocale,
  siteName,
  type SiteLocale,
} from "@/lib/metadata";

const rootTexts: Record<SiteLocale, { title: string; description: string }> = {
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
};

/**
 * Root layout metadata (FE-7 safety net). Every page should still build its
 * own metadata with createPageMetadata; this only guarantees that a page
 * which does not (or a 404) still has a title, a description, the Open
 * Graph site name, locale, type and the shared 1200×630 image, and a large
 * Twitter card, and the web app manifest. It sets no canonical URL, no hreflang and no og:url:
 * inherited by a child page they would point at the wrong address.
 */
export function createRootLayoutMetadata(locale: SiteLocale): Metadata {
  const { title, description } = rootTexts[locale];
  const images = [defaultSocialImage];

  return {
    metadataBase: new URL(siteUrl),
    // public/site.webmanifest (identity v1). The icons themselves are the
    // src/app file conventions: favicon.ico, icon.png, icon.svg, apple-icon.png.
    manifest: webManifestPath,
    title,
    description,
    openGraph: {
      type: "website",
      siteName,
      locale: getOpenGraphLocale(locale),
      title,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}
