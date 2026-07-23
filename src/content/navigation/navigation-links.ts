const INTERNAL_ORIGIN = "https://internal.sabandurali.invalid";

function getText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function hasUnsafeCharacters(value: string): boolean {
  return /[\u0000-\u001F\u007F\\]/.test(value);
}

export function normalizeInternalNavigationPath(
  value: unknown,
): string | null {
  const path = getText(value);

  if (
    path === null ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    hasUnsafeCharacters(path)
  ) {
    return null;
  }

  try {
    const url = new URL(path, INTERNAL_ORIGIN);

    if (url.origin !== INTERNAL_ORIGIN) return null;

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

function normalizeMailto(value: string): string | null {
  if (hasUnsafeCharacters(value)) return null;

  const match = /^mailto:([^?]+)(?:\?([^#]*))?$/i.exec(value);
  const address = match?.[1]?.trim();

  if (
    address === undefined ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)
  ) {
    return null;
  }

  return match?.[2] === undefined
    ? `mailto:${address}`
    : `mailto:${address}?${match[2]}`;
}

function normalizeTel(value: string): string | null {
  if (hasUnsafeCharacters(value)) return null;

  const number = value.slice("tel:".length).trim();

  return /^\+?[0-9(). -]{5,30}$/.test(number)
    ? `tel:${number}`
    : null;
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

  try {
    const url = new URL(href);

    return url.protocol === "https:" &&
      url.username === "" &&
      url.password === ""
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function isExternalNavigationHref(href: string): boolean {
  return (
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  );
}
