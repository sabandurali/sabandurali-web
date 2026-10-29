import type { Where } from "payload";
import { siteUrl } from "@/config/site";
import { getText, isRecord } from "@/content/guards";
import { getSafeHref } from "@/content/links";

/**
 * Shared validation rules for Payload collections. Everything here is pure so
 * that `node:test` covers it without a database.
 */

/** Upload and relationship fields that render as images accept only images. */
export const imageMediaFilter: Where = {
  mimeType: {
    contains: "image/",
  },
};

/**
 * An absolute `https://` URL without embedded credentials: the public rule
 * (`getSafeHref`), and stored exactly as typed (no surrounding or inner
 * whitespace), so the admin and the public site accept the same links.
 */
export function isHttpsUrl(value: unknown): boolean {
  const text = getText(value);

  return (
    text !== null &&
    text === value &&
    !/\s/.test(text) &&
    getSafeHref(text, { httpsOnly: true }) !== null
  );
}

/**
 * A link in a page block: an in-page anchor, a site path or an absolute
 * http(s) URL without credentials. It is the rule the page mapper applies
 * (`getSafeHref` with anchors and site paths), so a link the admin accepts
 * is never dropped from the public page.
 */
export function validatePageLink(value: unknown): true | string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "Bağlantı boş olamaz.";
  }

  return getSafeHref(value, { allowAnchor: true, allowRelative: true }) === null
    ? "Geçerli bir site içi, #çapa, http veya https bağlantısı girin (kullanıcı adı ve parola içermeden)."
    : true;
}

/**
 * A canonical URL must stay on this site: a root-relative path such as
 * `/kitaplar/ornek` or an absolute URL on `https://www.sabandurali.com`.
 * Queries and fragments are refused because a canonical names one document.
 */
export function isSiteCanonicalUrl(value: unknown): boolean {
  const text = getText(value);

  if (
    text === null ||
    text !== value ||
    /[\s\\?#]/.test(text) ||
    text.startsWith("//")
  ) {
    return false;
  }

  if (text.startsWith("/")) return true;

  try {
    const url = new URL(text);
    const site = new URL(siteUrl);

    return (
      url.origin === site.origin &&
      url.username === "" &&
      url.password === "" &&
      url.search === "" &&
      url.hash === ""
    );
  } catch {
    return false;
  }
}

export function validateOptionalSiteCanonical(value: unknown): true | string {
  return value === null || value === undefined || value === ""
    ? true
    : isSiteCanonicalUrl(value) ||
        "Canonical adresi / ile başlayan site içi bir yol veya https://www.sabandurali.com adresi olmalıdır.";
}

/**
 * A Lexical value has visible content when a text node has non-blank text or
 * an upload node is present. Mirrors what the public article mapper requires.
 */
export function hasMeaningfulRichText(value: unknown): boolean {
  const hasMeaningfulNode = (node: unknown): boolean => {
    if (!isRecord(node)) return false;
    if (node.type === "text") return getText(node.text) !== null;
    if (node.type === "upload") return true;

    return (
      Array.isArray(node.children) && node.children.some(hasMeaningfulNode)
    );
  };

  return (
    isRecord(value) &&
    isRecord(value.root) &&
    Array.isArray(value.root.children) &&
    value.root.children.some(hasMeaningfulNode)
  );
}
