export function getSafeArticleHref(
  value: string | undefined,
  allowRelative = true,
): string | null {
  if (value === undefined) {
    return null;
  }

  if (allowRelative && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function isExternalArticleHref(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}
