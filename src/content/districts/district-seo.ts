import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/config/site";
import { districtGuidePath, getDistrictUrl } from "./district-routes";
import type { District } from "./district-registry";
import type { DistrictGuide } from "./district-guide-projection";
export function districtMetadata(
  district: District,
  guide: DistrictGuide | null,
): Metadata {
  const title = `${district.name} Rehberi | Tarih, Yaşam, Ulaşım ve Gayrimenkul | Şaban Durali`;
  const description =
    guide?.summary ||
    `${district.name} ilçe rehberi: tarih, yaşam, ulaşım, mahalleler, yapı dokusu ve kaynak temelli İstanbul araştırmaları.`;
  const url = getDistrictUrl(district.slug);
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
        description: guide?.summary ?? undefined,
        dateModified: guide?.updatedAt ?? undefined,
        breadcrumb: { "@id": `${url}#breadcrumb` },
        about: { "@type": "Place", name: `${district.name}, İstanbul` },
      },
    ],
  };
}
