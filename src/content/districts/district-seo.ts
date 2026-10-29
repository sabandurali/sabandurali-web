import { verifiedDistrictImages } from "@/content/photos/verified-district-images";
import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/config/site";
import { getUiStrings } from "@/components/ui/strings";
import {
  createOptimizedSocialImage,
  createPageMetadata,
  truncateMetaDescription,
  type SocialImage,
} from "@/lib/metadata";
import {
  districtGuidePath,
  getDistrictPath,
  getDistrictUrl,
} from "./district-routes";
import type { District } from "./district-registry";
import type { DistrictGuide } from "./district-guide-projection";

/** Narrative sections; a guide without any of them is only a placeholder. */
const narrativeSections = [
  "summary",
  "history",
  "geography",
  "life",
  "transportation",
  "placesGuide",
  "distinctiveFeatures",
  "researchTopics",
  "housingTexture",
  "regionalAssessment",
] as const satisfies ReadonlyArray<keyof DistrictGuide>;

/**
 * A district page is indexable only while a published guide shows at least
 * one narrative section. Without a guide, or when the content policy hides
 * every section (expired or unreviewed sources), the page renders empty
 * placeholders and must stay out of search results and the sitemap.
 */
export function isDistrictGuideIndexable(
  guide: DistrictGuide | null,
): guide is DistrictGuide {
  return (
    guide !== null &&
    narrativeSections.some((section) => guide[section] !== null)
  );
}

/**
 * A district news list is indexable while it has at least one item; an
 * empty list is a placeholder. The news page robots rule and the sitemap
 * both use this.
 */
export function isDistrictNewsPageIndexable(
  news: ReadonlyArray<unknown>,
): boolean {
  return news.length > 0;
}

export function getDistrictTitle(district: District): string {
  return `${district.name} Rehberi: Tarih, Yaşam ve Ulaşım | Şaban Durali`;
}

function metaDescription(district: District, guide: DistrictGuide | null) {
  const fallback = `${district.name} için kaynak temelli ilçe rehberi; doğrulanmış tarih, yaşam, ulaşım, mahalle ve yapı dokusu içerikleri yayımlandıkça güncellenir.`;
  return truncateMetaDescription(guide?.summary?.trim() || fallback);
}

/**
 * The verified district photo, resized for sharing (the originals are up to
 * 4000 px and several megabytes), or the site-wide image.
 */
function districtSocialImage(district: District): SocialImage | null {
  const photo = verifiedDistrictImages[district.slug];
  return photo === undefined
    ? null
    : createOptimizedSocialImage({
        src: photo.src,
        alt: photo.alt,
        width: photo.width,
        height: photo.height,
      });
}

export function districtMetadata(
  district: District,
  guide: DistrictGuide | null,
): Metadata {
  const image = districtSocialImage(district);
  const indexable = isDistrictGuideIndexable(guide);

  return createPageMetadata({
    title: getDistrictTitle(district),
    description: metaDescription(district, guide),
    locale: "tr",
    path: getDistrictPath(district.slug),
    images: image === null ? undefined : [image],
    index: indexable,
    follow: true,
  });
}

export function districtJsonLd(
  district: District,
  guide: DistrictGuide | null,
) {
  const url = getDistrictUrl(district.slug);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        // The visible breadcrumb's trail (DistrictGuideArticle, homeCrumb).
        itemListElement: [
          [getUiStrings("tr").home, getUiStrings("tr").homePath],
          ["İstanbul", "/gayrimenkul-ve-istanbul"],
          ["İlçeler", districtGuidePath],
          [district.name, getDistrictPath(district.slug)],
        ].map(([name, path], index) => ({
          "@type": "ListItem",
          position: index + 1,
          name,
          item: getAbsoluteUrl(path),
        })),
      },
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: `${district.name} İlçe Rehberi`,
        inLanguage: "tr-TR",
        description: metaDescription(district, guide),
        dateModified: guide?.updatedAt ?? undefined,
        breadcrumb: { "@id": `${url}#breadcrumb` },
        about: { "@type": "Place", name: `${district.name}, İstanbul` },
      },
    ],
  };
}
