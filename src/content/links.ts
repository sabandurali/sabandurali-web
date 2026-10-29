import { getText } from "@/content/guards";

export type SafeHrefOptions = {
  /** Site paths such as `/makaleler/x` (never protocol-relative `//host`). */
  allowRelative?: boolean;
  /** In-page anchors such as `#bolum-2`. */
  allowAnchor?: boolean;
  /** Only `https:` for absolute URLs; otherwise `http:` is accepted too. */
  httpsOnly?: boolean;
};

const ANCHOR = /^#[a-z][a-z0-9-]*$/;

/**
 * The one rule for links that content can carry to the public site: a site
 * path or anchor when the caller allows them, otherwise an absolute http(s)
 * URL without embedded credentials (`https://user:pass@host` is refused
 * everywhere, so a link rejected in one content type is never published by
 * another). Returns the normalized href, or null.
 */
export function getSafeHref(
  value: unknown,
  {
    allowRelative = false,
    allowAnchor = false,
    httpsOnly = false,
  }: SafeHrefOptions = {},
): string | null {
  const href = getText(value);

  if (href === null) return null;
  if (allowAnchor && ANCHOR.test(href)) return href;
  if (href.startsWith("/")) {
    return allowRelative && !href.startsWith("//") ? href : null;
  }

  try {
    const url = new URL(href);
    const protocols = httpsOnly ? ["https:"] : ["https:", "http:"];

    return protocols.includes(url.protocol) &&
      url.username === "" &&
      url.password === ""
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
