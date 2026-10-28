/**
 * Shared runtime guards for CMS data. Mappers treat every Payload value as
 * untrusted input: relationships may be IDs or populated documents, optional
 * groups may be null and editors may leave text fields blank.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A trimmed, non-empty string or null. */
export function getText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export function getFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function getPositiveNumber(value: unknown): number | null {
  const number = getFiniteNumber(value);
  return number !== null && number > 0 ? number : null;
}

/** The ID of a relationship that is either unpopulated or populated. */
export function getRelationshipID(value: unknown): string | null {
  if (typeof value === "string" && value.trim() !== "") return value;
  if (isRecord(value) && typeof value.id === "string" && value.id !== "") {
    return value.id;
  }
  return null;
}

/** True when the value is a valid timestamp that is not in the future. */
export function isPublishedBy(value: unknown, now: Date): value is string {
  if (typeof value !== "string") return false;

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp <= now.getTime();
}
