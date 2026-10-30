import { getText } from "@/content/guards";

export type SafeHrefOptions = {
  /**
   * Site paths such as `/makaleler/x` that resolve to this origin (never
   * protocol-relative `//host`, `/\host` or a path with control characters).
   */
  allowRelative?: boolean;
  /** In-page anchors such as `#bolum-2`. */
  allowAnchor?: boolean;
  /** Only `https:` for absolute URLs; otherwise `http:` is accepted too. */
  httpsOnly?: boolean;
};

const ANCHOR = /^#[a-z][a-z0-9-]*$/;

/** A placeholder origin to resolve site paths against; never requested. */
export const INTERNAL_ORIGIN = "https://internal.sabandurali.invalid";

/**
 * Control characters and backslashes: the URL parser drops TAB, LF and CR
 * and reads `\` as `/`, so `/\host` and `/\t/host` lead to another origin.
 */
export function hasUnsafeUrlCharacters(value: string): boolean {
  return /[\u0000-\u001F\u007F\\]/.test(value);
}

/**
 * Whether a root-relative path stays on this site once a browser resolves
 * it. Protocol-relative `//host`, backslashes and control characters fail.
 */
export function isSameOriginPath(path: string): boolean {
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    hasUnsafeUrlCharacters(path)
  ) {
    return false;
  }

  try {
    return new URL(path, INTERNAL_ORIGIN).origin === INTERNAL_ORIGIN;
  } catch {
    return false;
  }
}

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
    return allowRelative && isSameOriginPath(href) ? href : null;
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
