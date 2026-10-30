// Pure rules of the performance budget check (scripts/perf/budget.mjs).
import { publicRoutes } from "../a11y/a11y-expectations.mjs";

/**
 * The page types of the accessibility check that render a page (the 404
 * screens are left out): one cold load each.
 */
export const budgetRoutes = Object.freeze(
  publicRoutes.filter((route) => route.status === 200),
);

/**
 * A mid-range phone on a slow 4G link, as Lighthouse's mobile preset:
 * 390 × 844 viewport, 4× CPU slowdown, 150 ms RTT, 1.6 Mbit/s down and
 * 750 kbit/s up (applied with DevTools throttling, so times are real).
 */
export const throttling = Object.freeze({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  cpuSlowdown: 4,
  latencyMs: 150,
  downloadBytesPerSecond: (1.6 * 1024 * 1024) / 8,
  uploadBytesPerSecond: (750 * 1024) / 8,
});

const KiB = 1024;

/**
 * Per page, measured on the static CI build (2026-10-31: fonts 77–92 KiB,
 * scripts 165–171 KiB, LCP ≈ 0.8 s, CLS ≤ 0.2):
 * - fonts: PERF-FONTS (Archivo 77 KiB + Martian Mono 15 KiB);
 * - scripts: the compressed JavaScript a page downloads, ~15 % headroom;
 * - LCP: the Core Web Vitals "good" threshold;
 * - CLS: the "poor" threshold for now. The font swap still moves two
 *   pages (the district guide plate and the English contact page, 0.14–0.2
 *   on the throttled profile); lower it to 0.1 once they are fixed.
 */
export const budget = Object.freeze({
  fontBytes: 100 * KiB,
  scriptBytes: 200 * KiB,
  lcpMs: 2500,
  cls: 0.25,
});

/** The kind of a loaded resource, from its URL path. */
export function resourceKind(url) {
  const { pathname } = new URL(url);
  if (/\.woff2?$/i.test(pathname)) return "font";
  if (/\.m?js$/i.test(pathname)) return "script";
  if (/\.css$/i.test(pathname)) return "style";
  return "other";
}

/**
 * Bytes per kind from Resource Timing entries ({ name, encodedBodySize }):
 * the compressed body size, which is what crosses the network.
 */
export function bytesByKind(entries) {
  const totals = { font: 0, script: 0, style: 0, other: 0 };
  for (const entry of entries) {
    totals[resourceKind(entry.name)] += entry.encodedBodySize;
  }
  return totals;
}

/** Cumulative layout shift: the largest session window (web-vitals rule). */
export function cumulativeLayoutShift(shifts) {
  let worst = 0;
  let current = 0;
  let first = -Infinity;
  let last = -Infinity;
  for (const { value, startTime, hadRecentInput } of shifts) {
    if (hadRecentInput) continue;
    if (startTime - last < 1000 && startTime - first < 5000) {
      current += value;
    } else {
      current = value;
      first = startTime;
    }
    last = startTime;
    worst = Math.max(worst, current);
  }
  return worst;
}

function kib(bytes) {
  return `${(bytes / KiB).toFixed(1)} KiB`;
}

/** Budget problems of one page's measurements; empty when it passes. */
export function budgetProblems(metrics, limits = budget) {
  const problems = [];
  if (metrics.fontBytes > limits.fontBytes)
    problems.push(`fonts ${kib(metrics.fontBytes)} > ${kib(limits.fontBytes)}`);
  if (metrics.scriptBytes > limits.scriptBytes)
    problems.push(
      `scripts ${kib(metrics.scriptBytes)} > ${kib(limits.scriptBytes)}`,
    );
  if (metrics.lcpMs === null) problems.push("no largest contentful paint");
  else if (metrics.lcpMs > limits.lcpMs)
    problems.push(`LCP ${Math.round(metrics.lcpMs)} ms > ${limits.lcpMs} ms`);
  if (metrics.cls > limits.cls)
    problems.push(`CLS ${metrics.cls.toFixed(3)} > ${limits.cls}`);
  return problems;
}

/**
 * Loads per page at most. Bytes and the HTTP status are the same on every
 * load, so they fail at once; LCP and CLS depend on when the fonts and
 * scripts arrive on a shared CI runner, so a page over those limits is
 * measured again and fails only when every load is over budget.
 */
export const maxAttempts = 3;

/** Whether a page's problems may be noise that a fresh load can clear. */
export function shouldRemeasure(metrics, attempt, limits = budget) {
  const problems = budgetProblems(metrics, limits);
  return (
    problems.length > 0 &&
    attempt < maxAttempts &&
    metrics.fontBytes <= limits.fontBytes &&
    metrics.scriptBytes <= limits.scriptBytes
  );
}
