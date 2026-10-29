import { getSafeHref } from "@/content/links";

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
  return typeof value === "string" && getSafeHref(value) !== null;
}
/** The timestamp of a valid date string that is not in the future. */
function parsePastDate(value: unknown, now: number): number | null {
  if (typeof value !== "string") return null;
  const time = Date.parse(value);
  return Number.isFinite(time) && time <= now ? time : null;
}
/**
 * A population register release (TÜİK ADNKS or another TÜİK table) counts
 * people. It can support a population figure, a neighbourhood list and the
 * overview or comparison that quotes them, never a history, everyday life,
 * transport, places or research text.
 */
const statisticalReleaseSections: readonly DistrictSection[] = [
  "summary",
  "facts",
  "neighborhoods",
  "regionalAssessment",
];
export function isStatisticalRelease(
  source: Pick<DistrictSource, "url" | "title">,
): boolean {
  if (/Adrese Dayalı Nüfus Kayıt Sistemi|\bADNKS\b/iu.test(source.title ?? ""))
    return true;
  if (!isPublicSourceUrl(source.url)) return false;
  const host = new URL(source.url).hostname.toLowerCase();
  return host === "tuik.gov.tr" || host.endsWith(".tuik.gov.tr");
}
/** Whether the kind of source can support the section at all. */
export function sourceKindFitsSection(
  source: Pick<DistrictSource, "url" | "title">,
  section: DistrictSection,
): boolean {
  return (
    !isStatisticalRelease(source) ||
    statisticalReleaseSections.includes(section)
  );
}
const dayMs = 24 * 60 * 60 * 1000;
/** Market figures are dynamic: data and check expire after 90 days. */
export const MARKET_DATA_MAX_AGE_DAYS = 90;
/**
 * "Transportation claims require current support" (§H): lines, stops and
 * timetables change, so a transport source must have been checked within
 * this window. Provisional value; the owner sets the final one.
 */
export const TRANSPORTATION_CHECK_MAX_AGE_DAYS = 365;
/** Periodic values need a dated source; dynamic values expire. */
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
  const checkedAt = parsePastDate(source.checkedAt, now);
  const dataDate = parsePastDate(source.dataDate, now);
  if (
    source.needsVerification !== false ||
    !isPublicSourceUrl(source.url) ||
    !source.title?.trim() ||
    !source.publisher?.trim() ||
    !source.sections?.includes(section) ||
    !sourceKindFitsSection(source, section) ||
    checkedAt === null
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
    dataDate === null
  )
    return false;
  if (
    ["facts", "neighborhoods", "planningDevelopments"].includes(section) &&
    !(source.primary === true && source.sourceType === "official")
  )
    return false;
  if (section === "marketData") {
    const threshold = now - MARKET_DATA_MAX_AGE_DAYS * dayMs;
    if (dataDate === null || checkedAt < threshold || dataDate < threshold)
      return false;
  }
  if (
    section === "transportation" &&
    checkedAt < now - TRANSPORTATION_CHECK_MAX_AGE_DAYS * dayMs
  )
    return false;
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
