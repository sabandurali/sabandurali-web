// Performance budget of every public page type (PERF-CI-BUDGET) against a
// local production build: one cold load per page on a throttled phone
// profile (budget-expectations.mjs → throttling), then
//   - font bytes ≤ 100 KiB (PERF-FONTS keeps them at ~92 KiB),
//   - JavaScript bytes within the script budget,
//   - largest contentful paint and cumulative layout shift within budget.
// It uses the Playwright Chromium the e2e checks already install, so CI
// needs no extra dependency. It only targets a local server:
//   npm run build && npm run start -- --hostname 127.0.0.1 --port 3101
//   PERF_TEST_URL=http://127.0.0.1:3101 node scripts/perf/budget.mjs
// BROWSER_CHANNEL picks the browser (default "chrome", CI uses "chromium").
// The JSON report goes to PERF_TEST_OUTPUT (default /tmp/perf-budget).
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { localOriginProblem } from "../a11y/a11y-expectations.mjs";
import {
  budget,
  budgetProblems,
  budgetRoutes,
  bytesByKind,
  cumulativeLayoutShift,
  throttling,
} from "./budget-expectations.mjs";

const base = process.env.PERF_TEST_URL || "http://127.0.0.1:3101";
const originProblem = localOriginProblem(base);
if (originProblem) throw new Error(originProblem);
const output = process.env.PERF_TEST_OUTPUT || "/tmp/perf-budget";
await mkdir(output, { recursive: true });

/** Starts the observers before any page script runs. */
function observeVitals() {
  const vitals = { lcp: null, shifts: [] };
  Object.defineProperty(window, "__perfBudget", { value: vitals });
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const last = entries[entries.length - 1];
    if (last) vitals.lcp = last.startTime;
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      vitals.shifts.push({
        value: entry.value,
        startTime: entry.startTime,
        hadRecentInput: entry.hadRecentInput,
      });
    }
  }).observe({ type: "layout-shift", buffered: true });
}

const browser = await chromium.launch({
  headless: true,
  channel: process.env.BROWSER_CHANNEL || "chrome",
});
const rows = [];

try {
  for (const route of budgetRoutes) {
    // A new context per page: a cold cache, as a first visit.
    const context = await browser.newContext({
      viewport: throttling.viewport,
      deviceScaleFactor: throttling.deviceScaleFactor,
      isMobile: true,
      hasTouch: true,
    });
    await context.addInitScript(observeVitals);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: throttling.latencyMs,
      downloadThroughput: throttling.downloadBytesPerSecond,
      uploadThroughput: throttling.uploadBytesPerSecond,
    });
    await cdp.send("Emulation.setCPUThrottlingRate", {
      rate: throttling.cpuSlowdown,
    });

    const response = await page.goto(`${base}${route.path}`, {
      waitUntil: "load",
      timeout: 120_000,
    });
    // Late fonts, hydration and lazy scripts settle; LCP is final once the
    // user would interact, so it is read before any input.
    await page.waitForLoadState("networkidle", { timeout: 60_000 });
    const measured = await page.evaluate(() => ({
      vitals: window.__perfBudget,
      resources: performance.getEntriesByType("resource").map((entry) => ({
        name: entry.name,
        encodedBodySize: entry.encodedBodySize,
      })),
    }));
    const bytes = bytesByKind(measured.resources);
    const metrics = {
      fontBytes: bytes.font,
      scriptBytes: bytes.script,
      styleBytes: bytes.style,
      lcpMs: measured.vitals?.lcp ?? null,
      cls: cumulativeLayoutShift(measured.vitals?.shifts ?? []),
    };
    const problems =
      response?.status() === route.status
        ? budgetProblems(metrics)
        : [`HTTP ${response?.status()} instead of ${route.status}`];
    rows.push({ path: route.path, type: route.type, ...metrics, problems });
    console.log(
      `${problems.length === 0 ? "ok  " : "FAIL"} ${route.path} — fonts ${(metrics.fontBytes / 1024).toFixed(1)} KiB, scripts ${(metrics.scriptBytes / 1024).toFixed(1)} KiB, LCP ${Math.round(metrics.lcpMs ?? -1)} ms, CLS ${metrics.cls.toFixed(3)}${problems.length ? ` → ${problems.join("; ")}` : ""}`,
    );
    await context.close();
  }
} finally {
  await browser.close();
}

await writeFile(
  path.join(output, "report.json"),
  `${JSON.stringify({ base, budget, throttling, rows }, null, 2)}\n`,
);
const failed = rows.filter((row) => row.problems.length > 0);
if (failed.length > 0) {
  console.error(`${failed.length} page(s) over budget.`);
  process.exit(1);
}
console.log(`${rows.length} pages within budget.`);
