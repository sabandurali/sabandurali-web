import { getSafeHref } from "@/content/links";

/** A rich text or article link: a site path or an http(s) URL. */
export function getSafeArticleHref(
  value: string | undefined,
  allowRelative = true,
): string | null {
  return getSafeHref(value, { allowRelative });
}

export function isExternalArticleHref(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}
