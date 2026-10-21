/** Presentation only: keep stored values and public API types unchanged. */
export function formatDistrictNumber(value: string | number | null | undefined): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "string" && !/^\d+$/.test(value)) return value;
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString("tr-TR", { maximumFractionDigits: 10 }) : String(value);
}
export function visibleDistrictSection(index: number, researchCount: number, newsCount: number) {
  return (index !== 10 || researchCount > 0) && (index !== 11 || newsCount > 0);
}
export function districtSectionNumber(index: number, researchCount: number, newsCount: number) {
  return String(index + 1 - (index > 10 && !researchCount ? 1 : 0) - (index > 11 && !newsCount ? 1 : 0)).padStart(2, "0");
}
