import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/config/site";
import {
  createBreadcrumbJsonLd,
  createHomeTrail,
} from "@/content/breadcrumb-seo";
import {
  createPersonReference,
  createWebsiteReference,
} from "@/content/entity-seo";
import { selectDistrictHeroPhoto } from "@/content/photos/district-photo-selection";
import { getPhotoPath } from "@/content/photos/photo-routes";
import { getPhotoCreditText } from "@/content/photos/photo-seo";
import type { PublicPhoto } from "@/content/photos/types";
import { verifiedDistrictImages } from "@/content/photos/verified-district-images";
import { getWorkspace } from "@/content/workspaces";
import { getContentLastModifiedIso } from "@/lib/content-dates";
import {
  createOptimizedSocialImage,
  createPageMetadata,
  createSocialImage,
  truncateMetaDescription,
  type SocialImage,
} from "@/lib/metadata";
import {
  districtGuidePath,
  getDistrictPath,
  getDistrictShareCardPath,
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
 * empty list is a placeholder. The news page robots rule (with the total
 * the database counted) and the sitemap both use this.
 */
export function isDistrictNewsPageIndexable(totalItems: number): boolean {
  return totalItems > 0;
}

export function getDistrictTitle(district: District): string {
  return `${district.name} Rehberi: Tarih, Yaşam ve Ulaşım | Şaban Durali`;
}

function metaDescription(district: District, guide: DistrictGuide | null) {
  const fallback = `${district.name} için kaynak temelli ilçe rehberi; doğrulanmış tarih, yaşam, ulaşım, mahalle ve yapı dokusu içerikleri yayımlandıkça güncellenir.`;
  return truncateMetaDescription(guide?.summary?.trim() || fallback);
}

/** The pixel size of the generated district share card. */
export const districtShareCardSize = { width: 1200, height: 630 } as const;

const sideLabel = {
  avrupa: "İSTANBUL · AVRUPA YAKASI",
  anadolu: "İSTANBUL · ANADOLU YAKASI",
} as const satisfies Record<District["side"], string>;

/**
 * The text of a district's generated share card: the registry's side and
 * name and the kind of page, nothing else. (Upper case is written out:
 * `toUpperCase` would turn "i" into "I" instead of "İ".)
 */
export function getDistrictShareCard(district: District) {
  return {
    eyebrow: sideLabel[district.side],
    title: district.name,
    subtitle: "İlçe Rehberi",
  };
}

/**
 * The image a district page is shared with, best first:
 *
 * 1. the verified district image (a licensed, credited file in `public/`),
 * 2. the hero photo the page itself shows (a published CMS photo of the
 *    district, `selectDistrictHeroPhoto`),
 * 3. the generated card with the district's name (`og.png` route).
 *
 * Photographs go through the image optimizer (the originals are up to
 * 4000 px and several megabytes).
 */
export function districtSocialImage(
  district: District,
  photos: readonly PublicPhoto[] = [],
): SocialImage {
  const verified = Object.hasOwn(verifiedDistrictImages, district.slug)
    ? verifiedDistrictImages[district.slug]
    : undefined;
  if (verified !== undefined) {
    return createOptimizedSocialImage({
      src: verified.src,
      alt: verified.alt,
      width: verified.width,
      height: verified.height,
    });
  }

  const hero = selectDistrictHeroPhoto([...photos]);
  if (hero !== undefined) {
    return createOptimizedSocialImage({
      src: hero.image.src,
      alt: hero.image.alt,
      width: hero.image.width,
      height: hero.image.height,
    });
  }

  return createSocialImage({
    src: getDistrictShareCardPath(district.slug),
    alt: `${district.name} ilçe rehberi, Şaban Durali`,
    ...districtShareCardSize,
  });
}

export function districtMetadata(
  district: District,
  guide: DistrictGuide | null,
  photos: readonly PublicPhoto[] = [],
): Metadata {
  return createPageMetadata({
    title: getDistrictTitle(district),
    description: metaDescription(district, guide),
    locale: "tr",
    path: getDistrictPath(district.slug),
    images: [districtSocialImage(district, photos)],
    index: isDistrictGuideIndexable(guide),
    follow: true,
  });
}

const parentWorkspaceKey = "gayrimenkul-ve-istanbul";

/**
 * The district pages' parent crumb: the workspace, under the title the
 * header navigation, the workspace page and the visible breadcrumb
 * (`districtWorkspaceCrumb`) give it.
 */
function districtWorkspaceTrailItem() {
  const workspace = getWorkspace(parentWorkspaceKey);
  if (workspace === null) {
    throw new Error(`Unknown workspace "${parentWorkspaceKey}".`);
  }
  return { name: workspace.title, path: `/${workspace.key}` };
}

/** The trail of a district page, the visible breadcrumb's four items. */
export function getDistrictTrail(district: District) {
  return createHomeTrail(
    "tr",
    districtWorkspaceTrailItem(),
    { name: "İlçeler", path: districtGuidePath },
    { name: district.name, path: getDistrictPath(district.slug) },
  );
}

/**
 * The district as a place: an administrative area of Istanbul at the
 * registry's verified focus point (not a boundary). No `sameAs` (Wikidata,
 * Wikipedia) is published until the owner approves a source for it.
 */
function districtPlace(district: District, url: string) {
  const [latitude, longitude] = district.center;
  return {
    "@type": "AdministrativeArea",
    "@id": `${url}#place`,
    name: district.name,
    geo: { "@type": "GeoCoordinates", latitude, longitude },
    containedInPlace: {
      "@type": "AdministrativeArea",
      name: "İstanbul",
      containedInPlace: { "@type": "Country", name: "Türkiye" },
    },
  };
}

/**
 * The district's share image as an ImageObject with what its record states:
 * the verified image's licence, record page and credit line, or the CMS hero
 * photo's credit. Nothing is published without an image.
 */
function districtImageObject(
  district: District,
  photos: readonly PublicPhoto[],
) {
  const verified = Object.hasOwn(verifiedDistrictImages, district.slug)
    ? verifiedDistrictImages[district.slug]
    : undefined;
  if (verified !== undefined) {
    return {
      "@type": "ImageObject",
      contentUrl: getAbsoluteUrl(verified.src),
      url: getAbsoluteUrl(verified.src),
      caption: verified.alt,
      width: verified.width,
      height: verified.height,
      creditText: verified.credit,
      license: verified.licenseUrl,
      acquireLicensePage: verified.recordUrl,
    };
  }

  const hero = selectDistrictHeroPhoto([...photos]);
  if (hero === undefined) return undefined;
  return {
    "@type": "ImageObject",
    "@id": `${getAbsoluteUrl(getPhotoPath(hero.slug, hero.language))}#image`,
    contentUrl: getAbsoluteUrl(hero.image.src),
    url: getAbsoluteUrl(getPhotoPath(hero.slug, hero.language)),
    caption: hero.image.alt,
    width: hero.image.width,
    height: hero.image.height,
    creditText: getPhotoCreditText(hero),
    copyrightNotice: hero.creditLicense?.trim() || undefined,
  };
}

/**
 * The structured data of a district page, built only from the public
 * projection, the district registry and the page's public photos:
 *
 * - the BreadcrumbList of the visible breadcrumb;
 * - the WebPage about the district (an AdministrativeArea of Istanbul);
 * - with an indexable guide, the guide as an Article of the site owner with
 *   its publication and modification dates and its image.
 *
 * A placeholder page (no indexable guide) claims no Article.
 */
export function districtJsonLd(
  district: District,
  guide: DistrictGuide | null,
  photos: readonly PublicPhoto[] = [],
) {
  const url = getDistrictUrl(district.slug);
  const breadcrumb = createBreadcrumbJsonLd(getDistrictTrail(district));
  const place = districtPlace(district, url);
  const image = districtImageObject(district, photos);
  const description = metaDescription(district, guide);
  const dateModified = guide ? getContentLastModifiedIso(guide) : undefined;
  const article = isDistrictGuideIndexable(guide)
    ? [
        {
          "@type": "Article",
          "@id": `${url}#article`,
          headline: `${district.name} İlçe Rehberi`,
          description,
          inLanguage: "tr-TR",
          author: createPersonReference(),
          publisher: createPersonReference(),
          isPartOf: createWebsiteReference(),
          mainEntityOfPage: { "@id": url },
          about: { "@id": place["@id"] },
          datePublished: guide.publishedAt ?? undefined,
          dateModified,
          image,
        },
      ]
    : [];

  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumb,
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: `${district.name} İlçe Rehberi`,
        inLanguage: "tr-TR",
        description,
        dateModified,
        isPartOf: createWebsiteReference(),
        breadcrumb: { "@id": breadcrumb["@id"] },
        about: { "@id": place["@id"] },
        primaryImageOfPage: image,
      },
      place,
      ...article,
    ],
  };
}
