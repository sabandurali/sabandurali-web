/** Shared by CMS validation, import validation and public projection. */
export const districtSectionOptions = [
  { value: "summary", label: "Genel bakış" },
  { value: "history", label: "Tarihçe" },
  { value: "geography", label: "İlçeyi tanı" },
  { value: "life", label: "Yaşam" },
  { value: "transportation", label: "Ulaşım" },
  { value: "facts", label: "Temel veriler" },
  { value: "neighborhoods", label: "Mahalleler" },
  { value: "housingTexture", label: "Yapı dokusu" },
  { value: "regionalAssessment", label: "Bölgesel değerlendirme" },
  { value: "marketData", label: "Piyasa göstergeleri" },
  { value: "planningDevelopments", label: "İmar gelişmeleri" },
  { value: "placesGuide", label: "Görülecek ve fotoğraflanacak yerler" },
  { value: "distinctiveFeatures", label: "İlçeyi özel kılanlar" },
  { value: "researchTopics", label: "İleri araştırma konuları" },
] as const;
export type DistrictSection = (typeof districtSectionOptions)[number]["value"];
export type DistrictSource = {
  title: string;
  publisher: string;
  url: string;
  sourceType: "official" | "academic" | "secondary" | "market" | "unclassified";
  primary?: boolean | null;
  dataDate?: string | null;
  checkedAt?: string | null;
  needsVerification?: boolean | null;
  sections?: DistrictSection[] | null;
};
export function isPublicSourceUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return (
      ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
function validPastDate(value: unknown, now: number): boolean {
  return (
    typeof value === "string" &&
    Number.isFinite(Date.parse(value)) &&
    Date.parse(value) <= now
  );
}
/** Periodic values need a dated source; dynamic values expire after 90 days. */
export function sourceSupportsSection(
  source: DistrictSource,
  section: DistrictSection,
  now = Date.now(),
): boolean {
  if (source.sourceType === "unclassified") return false;
  if (source.sourceType === "official") {
    if (!isPublicSourceUrl(source.url)) return false;
    const host = new URL(source.url).hostname.toLowerCase();
    if (!(
      host.endsWith(".gov.tr") ||
      host.endsWith(".bel.tr") ||
      [
        "metro.istanbul",
        "iett.istanbul",
        "ibb.istanbul",
        "sehirhatlari.istanbul",
        // Municipality identity: turkiye.gov.tr/bahcelievler-belediyesi
        "bahcelievler.istanbul",
      ].some((domain) => host === domain || host.endsWith(`.${domain}`))
    ))
      return false;
  }
  if (
    source.needsVerification !== false ||
    !isPublicSourceUrl(source.url) ||
    !source.title?.trim() ||
    !source.publisher?.trim() ||
    !source.sections?.includes(section) ||
    !validPastDate(source.checkedAt, now)
  )
    return false;
  if (
    [
      "facts",
      "neighborhoods",
      "transportation",
      "marketData",
      "planningDevelopments",
    ].includes(section) &&
    !validPastDate(source.dataDate, now)
  )
    return false;
  if (
    ["facts", "neighborhoods", "planningDevelopments"].includes(section) &&
    !(source.primary === true && source.sourceType === "official")
  )
    return false;
  if (["marketData", "planningDevelopments"].includes(section)) {
    const threshold = now - 90 * 24 * 60 * 60 * 1000;
    if (
      Date.parse(source.checkedAt!) < threshold ||
      Date.parse(source.dataDate!) < threshold
    )
      return false;
  }
  return true;
}
export function sectionIsPublic(
  section: DistrictSection,
  reviewed: readonly string[],
  sources: DistrictSource[],
  now = Date.now(),
): boolean {
  return (
    reviewed.includes(section) &&
    sources.some((source) => sourceSupportsSection(source, section, now))
  );
}
