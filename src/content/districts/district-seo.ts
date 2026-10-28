import { verifiedDistrictImages } from "@/content/photos/verified-district-images";
import type { Metadata } from "next";
import { getAbsoluteUrl, siteSocialImage } from "@/config/site";
import { districtGuidePath, getDistrictUrl } from "./district-routes";
import type { District } from "./district-registry";
import type { DistrictGuide } from "./district-guide-projection";

function metaDescription(district: District, guide: DistrictGuide | null) {
  const fallback = `${district.name} için kaynak temelli ilçe rehberi; doğrulanmış tarih, yaşam, ulaşım, mahalle ve yapı dokusu içerikleri yayımlandıkça güncellenir.`;
  const value = guide?.summary?.replace(/\s+/g, " ").trim() || fallback;
  return value;
}

export function districtMetadata(
  district: District,
  guide: DistrictGuide | null,
): Metadata {
  const title = `${district.name} Rehberi | Tarih, Yaşam, Ulaşım ve Gayrimenkul | Şaban Durali`;
  const description = metaDescription(district, guide);
  const url = getDistrictUrl(district.slug);
  const photo = verifiedDistrictImages[district.slug];
  const image = photo
    ? { url: getAbsoluteUrl(photo.src), alt: photo.alt }
    : siteSocialImage;
  return {
    title,
    description,
    alternates: { canonical: url, languages: { "tr-TR": url } },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: "tr_TR",
      siteName: "Şaban Durali",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
    robots: { index: true, follow: true },
  };
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
        itemListElement: [
          ["Ana Sayfa", "/"],
          ["İstanbul", "/gayrimenkul-ve-istanbul"],
          ["İlçeler", districtGuidePath],
          [district.name, `/istanbul/ilceler/${district.slug}`],
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
