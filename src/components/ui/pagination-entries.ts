export type PaginationEntry =
  { type: "page"; page: number } | { type: "gap"; key: string };

/** Current page clamped to 1…total (0 when there are no pages). */
export function clampPage(current: number, total: number): number {
  const pageCount = Math.max(0, Math.floor(total));
  if (pageCount === 0) return 0;
  return Math.min(Math.max(1, Math.floor(current)), pageCount);
}

/**
 * Pages to show: first, last, the current page with `siblings` on each
 * side, and gaps for skipped runs. A gap never stands for a single page
 * (that page is shown instead). Out-of-range input is clamped.
 */
export function getPaginationEntries(
  current: number,
  total: number,
  siblings = 1,
): PaginationEntry[] {
  const pageCount = Math.max(0, Math.floor(total));
  if (pageCount === 0) return [];
  const page = clampPage(current, total);
  const reach = Math.max(0, Math.floor(siblings));

  const shown = new Set<number>([1, pageCount]);
  for (let offset = -reach; offset <= reach; offset += 1) {
    const candidate = page + offset;
    if (candidate >= 1 && candidate <= pageCount) shown.add(candidate);
  }

  const pages = [...shown].sort((a, b) => a - b);
  const entries: PaginationEntry[] = [];

  pages.forEach((value, index) => {
    const previous = pages[index - 1];
    if (previous !== undefined) {
      if (value - previous === 2) {
        entries.push({ type: "page", page: previous + 1 });
      } else if (value - previous > 2) {
        entries.push({ type: "gap", key: `gap-${previous}-${value}` });
      }
    }
    entries.push({ type: "page", page: value });
  });

  return entries;
}
