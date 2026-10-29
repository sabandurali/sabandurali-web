/** Presentation only: keep stored values and public API types unchanged. */
export function formatDistrictNumber(
  value: string | number | null | undefined,
): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "string" && !/^\d+$/.test(value)) return value;
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString("tr-TR", { maximumFractionDigits: 10 })
    : String(value);
}
