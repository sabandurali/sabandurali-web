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
