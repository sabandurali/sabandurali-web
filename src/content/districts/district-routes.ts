import { getAbsoluteUrl } from "@/config/site";

export const districtGuidePath = "/istanbul/ilceler";

export function getDistrictPath(slug: string): string {
  return `${districtGuidePath}/${slug}`;
}

export function getDistrictNewsPath(slug: string): string {
  return `${getDistrictPath(slug)}/haberler`;
}

export function getDistrictUrl(slug: string): string {
  return getAbsoluteUrl(getDistrictPath(slug));
}

/**
 * The generated share card of a district page (`og.png` route), used when
 * the district has no photograph to share (`districtSocialImage`).
 */
export function getDistrictShareCardPath(slug: string): string {
  return `${getDistrictPath(slug)}/og.png`;
}

/** The generated share card of the district directory (`og.png` route). */
export const districtDirectoryShareCardPath = `${districtGuidePath}/og.png`;
