/**
 * Pure presentation model of the district guide. Everything here derives
 * from the public projection (DistrictGuide) and the registry; nothing adds
 * a fact the guide does not publish.
 */
import type { PublicPhoto } from "@/content/photos/types";
import {
  districtSectionOptions,
  type DistrictSection,
  type DistrictSource,
} from "@/content/districts/district-content-policy";
import type { DistrictGuide } from "@/content/districts/district-guide-projection";
import {
  districts,
  type District,
} from "@/content/districts/district-registry";
import { formatDistrictNumber } from "@/content/districts/district-presentation";
import { formatDate, toDateTimeAttribute } from "@/lib/format-date";
import type { Fact } from "@/components/ui/FactTable";
import type { CreditInfo } from "@/components/ui/Figure";

/**
 * The fixed section contract of docs/PROJECT-STATE.md §H: id, wayfinding
 * label (the SectionSign) and the default editorial heading. Order and ids
 * never change; `arastirmalar` and `haberler` are conditional.
 */
export const districtGuideSections = [
  { id: "genel-bakis", label: "Bir bakışta", heading: "Tek bakışta" },
  { id: "tarihce", label: "İlçenin hikâyesi", heading: "Geçmişten bugüne" },
  { id: "tani", label: "İlçeyi okumak", heading: "Konum ve kentsel yapı" },
  {
    id: "yasam",
    label: "Gündelik yaşam ve ulaşım",
    heading: "Gündelik yaşam nasıl akıyor?",
  },
  { id: "mahalleler", label: "Mahalleler", heading: "Mahalleler" },
  {
    id: "gayrimenkul",
    label: "Konut ve yapılaşma",
    heading: "Konut, yapılaşma ve veri",
  },
  {
    id: "imar",
    label: "Dönüşüm ve şehircilik",
    heading: "Değişimi belgeyle izlemek",
  },
  {
    id: "saha",
    label: "Görülecek ve fotoğraflanacak yerler",
    heading: "Sahadan bakış",
  },
  {
    id: "kareler",
    label: "İlçeden kareler",
    heading: "Fotoğrafla kurulan ikinci anlatı",
  },
  { id: "kimlik", label: "İlçeyi özel kılanlar", heading: "İlçenin karakteri" },
  {
    id: "arastirmalar",
    label: "Araştırmalar ve analizler",
    heading: "Rehberden daha derine",
  },
  { id: "haberler", label: "İlçeden haberler", heading: "Güncel gelişmeler" },
  {
    id: "kaynaklar",
    label: "Kaynaklar ve metodoloji",
    heading: "Kaynağı görünür tutmak",
  },
  { id: "guncelleme", label: "Son güncelleme", heading: "Canlı bir rehber" },
] as const;

export type DistrictGuideSectionId =
  (typeof districtGuideSections)[number]["id"];

export type VisibleDistrictSection = {
  id: DistrictGuideSectionId;
  label: string;
  heading: string;
  /** 1-based stop number among the visible sections. */
  number: number;
};

/**
 * The sections that render, numbered consecutively. Research and news show
 * when they have items, or when their query failed (the section then says
 * it is temporarily unavailable instead of silently disappearing).
 */
export function getVisibleDistrictSections({
  research,
  news,
}: {
  research: boolean;
  news: boolean;
}): VisibleDistrictSection[] {
  return districtGuideSections
    .filter(
      (section) =>
        (section.id !== "arastirmalar" || research) &&
        (section.id !== "haberler" || news),
    )
    .map((section, index) => ({ ...section, number: index + 1 }));
}

/** 1-based number of a source in the page's source list. */
export function sourceNumbersFor(
  sources: readonly DistrictSource[],
  sections: readonly DistrictSection[],
): number[] {
  return sources.flatMap((source, index) =>
    source.sections?.some((section) => sections.includes(section))
      ? [index + 1]
      : [],
  );
}

/** Splits editorial text into paragraphs at blank lines. */
export function splitParagraphs(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

const lineCodePattern =
  /(?<![\p{L}\p{N}])(M\d{1,2}[AB]?|T\d{1,2}|F\d|TF\d|B1|Marmaray)(?![\p{L}\p{N}])/gu;

/**
 * Rail line codes named in a published text ("M1B", "M7", "Marmaray"), in
 * order of first mention. Only codes the text itself names: the guide never
 * adds a line the verified transport section does not mention.
 */
export function extractLineCodes(text: string | null | undefined): string[] {
  if (!text) return [];
  const codes: string[] = [];
  for (const match of text.matchAll(lineCodePattern)) {
    const code = match[1];
    if (code && !codes.includes(code)) codes.push(code);
  }
  return codes;
}

function foldName(value: string): string {
  return value
    .normalize("NFC")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Registry slugs of the neighbours a guide names in its facts
 * ("Bağcılar, Güngören … ve Gaziosmanpaşa"), in the order named. Unknown
 * names and the district itself are ignored.
 */
export function parseNeighbourSlugs(
  value: string | null | undefined,
  self?: string,
): string[] {
  if (!value) return [];
  const slugs: string[] = [];
  for (const part of value.split(/,|\s+ve\s+|;/u)) {
    const name = foldName(part.replace(/[.()]/g, "").trim());
    if (!name) continue;
    const match = districts.find(
      (district) => foldName(district.name) === name,
    );
    if (match && match.slug !== self && !slugs.includes(match.slug)) {
      slugs.push(match.slug);
    }
  }
  return slugs;
}

export function sideLabel(district: Pick<District, "side">): string {
  return district.side === "avrupa" ? "Avrupa Yakası" : "Anadolu Yakası";
}

/**
 * Key facts for the FactTable. Source numbers are section-level: a fact
 * row lists the sources that support the guide's "facts" section (and the
 * neighbourhood count also those of "neighborhoods"); the caption says so.
 * Rows without a published value are left out.
 */
export function buildDistrictFacts(
  district: District,
  guide: DistrictGuide | null,
): Fact[] {
  const facts = guide?.facts ?? null;
  const sources = guide?.sources ?? [];
  const factSources = sourceNumbersFor(sources, ["facts"]);
  const countSources = sourceNumbersFor(sources, ["facts", "neighborhoods"]);
  const rows: Fact[] = [];

  const population = formatDistrictNumber(facts?.population);
  if (population) {
    const year = facts?.populationYear;
    rows.push({
      id: "population",
      label: "Nüfus",
      value: population,
      unit: "kişi",
      ...(year ? { date: String(year) } : {}),
      sources: factSources,
    });
  }

  const area =
    facts?.areaKm2 == null ? null : formatDistrictNumber(facts.areaKm2);
  if (area) {
    rows.push({
      id: "area",
      label: "Yüzölçümü",
      value: area,
      unit: "km²",
      sources: factSources,
    });
  }

  const neighbourhoodCount =
    facts?.neighborhoodCount ??
    (guide && guide.neighborhoods.length > 0
      ? guide.neighborhoods.length
      : null);
  if (neighbourhoodCount !== null) {
    rows.push({
      id: "neighbourhoods",
      label: "Mahalle",
      value: String(neighbourhoodCount),
      unit: "mahalle",
      sources:
        facts?.neighborhoodCount == null
          ? sourceNumbersFor(sources, ["neighborhoods"])
          : countSources,
    });
  }

  if (facts?.neighboringDistricts) {
    rows.push({
      id: "neighbours",
      label: "Komşu ilçeler",
      value: facts.neighboringDistricts,
      kind: "text",
      sources: factSources,
    });
  }

  rows.push({
    id: "side",
    label: "Yaka",
    value: sideLabel(district),
    kind: "text",
  });

  return rows;
}

const sourceTypeLabels: Record<DistrictSource["sourceType"], string> = {
  official: "Resmî",
  academic: "Akademik / kurumsal",
  secondary: "İkincil",
  market: "Piyasa platformu",
  unclassified: "Sınıflandırılmadı",
};

export type DistrictSourceRow = {
  number: number;
  title: string;
  publisher: string;
  url: string;
  kind: string;
  /** "Birincil kaynak" or "İkincil aktarım". */
  role: string;
  dataDate: string;
  dataDateTime: string | null;
  checkedAt: string;
  checkedAtDateTime: string | null;
  sections: string;
};

/** The numbered rows of the "Kaynaklar ve metodoloji" list. */
export function buildSourceRows(
  sources: readonly DistrictSource[],
): DistrictSourceRow[] {
  return sources.map((source, index) => {
    // This municipal page republishes a 2017 count; its recorded date is
    // the observation, not the data year (content trust package).
    const isLegacyCount = source.url.includes("ilcemizin-nufusu-son-1-yilda");
    return {
      number: index + 1,
      title: source.title,
      publisher: source.publisher,
      url: source.url,
      kind: sourceTypeLabels[source.sourceType],
      role: source.primary ? "Birincil kaynak" : "İkincil aktarım",
      dataDate: isLegacyCount
        ? "2017 nüfus verisi; kayıtlı tarih kaynak gözlemidir"
        : (formatDate(source.dataDate) ?? "Belirtilmemiş"),
      dataDateTime: isLegacyCount ? null : toDateTimeAttribute(source.dataDate),
      checkedAt: formatDate(source.checkedAt) ?? "Belirtilmemiş",
      checkedAtDateTime: toDateTimeAttribute(source.checkedAt),
      sections:
        source.sections
          ?.map(
            (section) =>
              districtSectionOptions.find(({ value }) => value === section)
                ?.label,
          )
          .filter(Boolean)
          .join(", ") || "Belirtilmemiş",
    };
  });
}

/**
 * Credit of a district photo. Historical archive photos store
 * "<credit> · Kaynak kaydı: <url>" in creditLicense; the record link
 * becomes the source link of the credit.
 */
export function districtPhotoCredit(photo: PublicPhoto): CreditInfo | null {
  const separator = " · Kaynak kaydı: ";
  const raw = photo.creditLicense?.trim() || null;
  const [licence, recordUrl] = raw?.includes(separator)
    ? raw.split(separator)
    : [raw, null];
  const credit: CreditInfo = {
    ...(photo.photographer ? { author: photo.photographer } : {}),
    ...(licence ? { licence } : {}),
    ...(recordUrl && /^https?:\/\//.test(recordUrl)
      ? { sourceUrl: recordUrl, sourceLabel: "Kaynak kaydı" }
      : {}),
  };
  return Object.keys(credit).length > 0 ? credit : null;
}

/** Caption line of a district photo: place · date. */
export function districtPhotoCaption(photo: PublicPhoto): string {
  return [
    photo.title,
    photo.neighborhood ?? photo.locationName,
    formatDate(photo.takenAt),
  ]
    .filter(Boolean)
    .join(" · ");
}

const planningStatuses: Record<string, string> = {
  teklif: "Teklif",
  planlama: "Planlama",
  "belediye-meclisi-karari": "Belediye Meclisi Kararı",
  onay: "Onay",
  aski: "Askı",
  ihale: "İhale",
  insaat: "İnşaat",
  uygulama: "Uygulama",
  tamamlandi: "Tamamlandı",
  belirsiz: "Belirsiz — Doğrulama gerekli",
};

export function planningStatusLabel(
  status: string | null | undefined,
): string | null {
  return status ? (planningStatuses[status] ?? null) : null;
}

/** News and photo category slugs ("ulasim-ve-altyapi") as readable text. */
export function categoryLabel(value: string | null | undefined): string | null {
  return value ? value.replaceAll("-", " ") : null;
}
