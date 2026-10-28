/**
 * Structured reports for content that the public site skips or replaces.
 *
 * The CMS can accept records that the public mappers reject (for example a
 * published book without a cover). Those records used to disappear silently
 * outside development; every skip is now logged in every environment as a
 * single JSON line so it shows up in the Vercel runtime and build logs.
 * Only identifiers and fixed reasons are logged, never field values.
 */
export type ContentScope =
  | "articles"
  | "books"
  | "districts"
  | "home"
  | "navigation"
  | "pages"
  | "photos"
  | "rich-text";

export type ContentIssue = {
  scope: ContentScope;
  reason: string;
  id?: string;
  locale?: string;
  /** Short machine-readable detail such as a node type or MIME type. */
  detail?: string;
};

export function reportContentIssue(
  issue: ContentIssue,
  severity: "warn" | "error" = "warn",
): void {
  const line = `[content] ${JSON.stringify({ severity, ...issue })}`;

  if (severity === "error") {
    console.error(line);
  } else {
    console.warn(line);
  }
}

/** Error message without stack or cause chain, safe for a log line. */
export function describeError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return typeof error === "string" ? error : "Unknown error";
}
