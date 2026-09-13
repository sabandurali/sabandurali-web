import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/config/site";
import { districtGuidePath, getDistrictUrl } from "./district-routes";
import type { District } from "./district-registry";
import type { DistrictGuide } from "./district-guide-projection";

function metaDescription(district: District, guide: DistrictGuide | null) {
  const fallback = `${district.name} için kaynak temelli ilçe rehberi; doğrulanmış tarih, yaşam, ulaşım, mahalle ve yapı dokusu içerikleri yayımlandıkça güncellenir.`;
  const value = guide?.summary?.replace(/\s+/g, " ").trim() || fallback;
  if (value.length <= 160) return value;
  const shortened = value.slice(0, 157).replace(/\s+\S*$/, "");
  return `${shortened}…`;
}

export function districtMetadata(
  district: District,
  guide: DistrictGuide | null,
): Metadata {
  const title = `${district.name} İlçe Rehberi | Şaban Durali`;
  const description = metaDescription(district, guide);
  const url = getDistrictUrl(district.slug);
  return {
    title,
    description,
    alternates: { canonical: url },
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
          {
            "@type": "ListItem",
            position: 1,
            name: "İstanbul İlçe Rehberi",
            item: getAbsoluteUrl(districtGuidePath),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: district.name,
            item: url,
          },
        ],
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
