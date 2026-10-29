import { personalBrandName } from "@/content/entity-seo";

/*
 * Credit rules of a public photograph. The mapper applies them to every
 * read, so a record saved without them (admin panel, an older import) is
 * withheld instead of being credited to someone who did not take it.
 */

/** District photo category of archive (historical) photographs. */
export const historicalDistrictPhotoCategory = "tarih";

/**
 * The value the Photos collection pre-fills for the photographer. A
 * historical archive photograph is never the owner's own work, so this
 * value on such a photo means the real creator was never entered.
 */
export const defaultPhotographer = personalBrandName;

export type PhotoCredit = {
  photographer: string | null;
  creditLicense: string | null;
  districtPhotoCategory: string | null;
};

/**
 * Why a photo may not be shown with its credit, or null when it may. Every
 * photo names its photographer (no fallback name is invented); a historical
 * photo also needs its real creator and its licence or required
 * attribution, as §H of docs/PROJECT-STATE.md demands.
 */
export function getPhotoCreditIssue(credit: PhotoCredit): string | null {
  const photographer = credit.photographer?.trim() ?? "";
  const creditLicense = credit.creditLicense?.trim() ?? "";

  if (photographer === "") return "photographer is missing";
  if (credit.districtPhotoCategory !== historicalDistrictPhotoCategory) {
    return null;
  }
  if (photographer === defaultPhotographer) {
    return "historical photo is credited to the default photographer";
  }
  if (creditLicense === "") {
    return "historical photo has no licence or required attribution";
  }
  return null;
}
