export type ClassValue = string | false | null | undefined;

/** Joins class names and drops empty values. No conflict resolution: pass
 * each property once (a component's own classes first, then `className`). */
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
