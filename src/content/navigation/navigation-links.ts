import { getText } from "@/content/guards";
import {
  INTERNAL_ORIGIN,
  getSafeHref,
  hasUnsafeUrlCharacters as hasUnsafeCharacters,
  isSameOriginPath,
} from "@/content/links";

export function normalizeInternalNavigationPath(value: unknown): string | null {
  const path = getText(value);

  if (path === null || !isSameOriginPath(path)) return null;

  const url = new URL(path, INTERNAL_ORIGIN);

  return `${url.pathname}${url.search}${url.hash}`;
}

function normalizeMailto(value: string): string | null {
  if (hasUnsafeCharacters(value)) return null;

  const match = /^mailto:([^?]+)(?:\?([^#]*))?$/i.exec(value);
  const address = match?.[1]?.trim();

  if (address === undefined || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    return null;
  }

  return match?.[2] === undefined
    ? `mailto:${address}`
    : `mailto:${address}?${match[2]}`;
}

function normalizeTel(value: string): string | null {
  if (hasUnsafeCharacters(value)) return null;

  const number = value.slice("tel:".length).trim();

  return /^\+?[0-9(). -]{5,30}$/.test(number) ? `tel:${number}` : null;
}

export function normalizeExternalNavigationUrl(
  value: unknown,
  allowContactProtocols = false,
): string | null {
  const href = getText(value);

  if (href === null || href.startsWith("//") || hasUnsafeCharacters(href)) {
    return null;
  }

  if (allowContactProtocols && href.toLowerCase().startsWith("mailto:")) {
    return normalizeMailto(href);
  }

  if (allowContactProtocols && href.toLowerCase().startsWith("tel:")) {
    return normalizeTel(href);
  }

  return getSafeHref(href, { httpsOnly: true });
}

export function isExternalNavigationHref(href: string): boolean {
  return (
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  );
}
