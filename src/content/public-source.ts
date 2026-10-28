import { assertProductionPayloadInfrastructure } from "@/lib/payloadInfrastructure";

/**
 * One switch per content type decides whether public pages read the
 * repository's static content or Payload. District guides follow
 * PAGE_PUBLIC_SOURCE (docs/PROJECT-STATE.md).
 */
export type PublicContentSource = "payload" | "static";

export type PublicSourceVariable =
  | "ARTICLE_PUBLIC_SOURCE"
  | "BOOK_PUBLIC_SOURCE"
  | "NAVIGATION_PUBLIC_SOURCE"
  | "PAGE_PUBLIC_SOURCE"
  | "PHOTO_PUBLIC_SOURCE";

/**
 * Pure parser. An unset or empty (whitespace-only) value means "static";
 * every other value must be exactly "static" or "payload". Anything else
 * fails loudly instead of silently falling back to one of the sources.
 */
export function parsePublicSource(
  variable: PublicSourceVariable,
  value: string | undefined,
): PublicContentSource {
  if (value === undefined || value.trim() === "") return "static";
  if (value === "static" || value === "payload") return value;

  throw new Error(
    `Invalid ${variable} value ${JSON.stringify(value)}. Expected "static" or "payload" (leave it empty for "static").`,
  );
}

/**
 * Reads the switch from the environment. Selecting Payload in a production
 * runtime also asserts the persistent database and storage infrastructure.
 */
export function readPublicSource(
  variable: PublicSourceVariable,
): PublicContentSource {
  const source = parsePublicSource(variable, process.env[variable]);

  if (source === "payload") assertProductionPayloadInfrastructure();

  return source;
}
