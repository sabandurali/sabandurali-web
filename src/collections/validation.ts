import type { Where } from "payload";
import { siteUrl } from "@/config/site";

/**
 * Shared validation rules for Payload collections. Everything here is pure so
 * that `node:test` covers it without a database.
 */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

/** Upload and relationship fields that render as images accept only images. */
export const imageMediaFilter: Where = {
  mimeType: {
    contains: "image/",
  },
};

/** An absolute `https://` URL with a host and without embedded credentials. */
export function isHttpsUrl(value: unknown): boolean {
  const text = getText(value);

  if (text === null || text !== value || /\s/.test(text)) return false;

  try {
    const url = new URL(text);

    return (
      url.protocol === "https:" &&
      url.hostname.length > 0 &&
      url.username === "" &&
      url.password === ""
    );
  } catch {
    return false;
  }
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
