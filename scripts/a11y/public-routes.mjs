// Accessibility and layout acceptance of every public route type against a
// local production build (CLAUDE.md, Definition of Done):
//   - axe-core WCAG 2.0/2.1/2.2 A and AA scan at 390, 820 and 1440 px,
//   - no horizontal scroll at 390, 820 and 1440 px,
//   - the first Tab stop is the visible skip link and it moves focus to <main>,
//   - every Tab stop of the first screens shows a focus indicator, at 1440
//     and 390 px, with no focus trap,
//   - the header menu opens with Enter, Tab reaches its items and Escape
//     closes it and returns focus, at 390, 1100 and 1440 px,
//   - under prefers-reduced-motion: reduce nothing animates or transitions
//     and the page does not scroll smoothly.
// It only targets a local server, for example:
//   npm run build && npm run start -- --hostname 127.0.0.1 --port 3101
//   A11Y_TEST_URL=http://127.0.0.1:3101 npm run e2e:a11y
// BROWSER_CHANNEL picks the browser (default "chrome", CI uses "chromium").
// A11Y_FIXTURES=1 checks the detail templates, the CMS block page, the filled
// district guide and the CMS navigation against a server on the CI fixture
// database instead (see docs/LOCAL-DEVELOPMENT.md); each fixture route must
// also render its fixture texts (`requiredContent`).
// The JSON report and screenshots go to A11Y_TEST_OUTPUT (default
// /tmp/public-a11y), never into the repository.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import {
  axeProblems,
  axeTags,
  contentProblems,
  detailRoutes,
  focusIndicatorProblem,
  localOriginProblem,
  menuCheckWidths,
  menuProblem,
  menuRequired,
  overflowProblem,
  pickDetailPath,
  reducedMotionProblems,
  routePlan,
  sameTabStop,
  skipLinkProblem,
  skippedDetailsProblems,
  viewportWidths,
} from "./a11y-expectations.mjs";

const base = process.env.A11Y_TEST_URL || "http://127.0.0.1:3101";
const originProblem = localOriginProblem(base);
if (originProblem) throw new Error(originProblem);
const output = process.env.A11Y_TEST_OUTPUT || "/tmp/public-a11y";
// A11Y_FIXTURES=1: the server reads the CI fixture database
// (npm run ci:seed-fixtures) and every detail template must be reached.
const plan = routePlan(process.env.A11Y_FIXTURES === "1");
const requireDetails =
  plan.requireDetails || process.env.A11Y_REQUIRE_DETAILS === "1";
await mkdir(output, { recursive: true });
const maxTabStops = 30;

const browser = await chromium.launch({
  headless: true,
  channel: process.env.BROWSER_CHANNEL || "chrome",
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "no-preference",
});
const rows = [];
const serverErrors = [];
const pageErrors = [];

/** Description of the focused element, evaluated in the page. */
function describeFocus() {
  const element = document.activeElement;
  if (!element || element === document.body) return null;
  // Next's development tools (the fixture run serves `next dev`, see
  // .github/workflows/ci.yml) sit after the page in the Tab order; a
  // production build never renders them. Reaching them ends the page.
  if (element.tagName === "NEXTJS-PORTAL") return null;
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  const pick = (s) => ({
    outlineStyle: s.outlineStyle,
    outlineWidth: s.outlineWidth,
    boxShadow: s.boxShadow,
  });
  const ancestors = [];
  let parent = element.parentElement;
  for (let i = 0; i < 3 && parent; i += 1, parent = parent.parentElement)
    ancestors.push(pick(getComputedStyle(parent)));
  const text = (element.textContent ?? "").trim().replace(/\s+/g, " ");
  return {
    tag: element.tagName.toLowerCase(),
    href: element.getAttribute("href"),
    text: text.slice(0, 60),
    label:
      `${element.tagName.toLowerCase()} "${text.slice(0, 40)}" ${element.getAttribute("href") ?? ""}`.trim(),
    visible:
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== "hidden" &&
      rect.bottom > 0 &&
      rect.top < innerHeight &&
      rect.right > 0 &&
      rect.left < innerWidth,
    // Document coordinates tell two links with the same label apart.
    position: {
      x: Math.round(rect.left + scrollX),
      y: Math.round(rect.top + scrollY),
    },
    style: pick(style),
    ancestors,
    insideMain: Boolean(element.closest("main")),
  };
}

/** Resolves once the scroll position is unchanged for three frames. */
function settleScroll() {
  return new Promise((resolve) => {
    let last = -1;
    let still = 0;
    const started = performance.now();
    const frame = () => {
      still = scrollY === last ? still + 1 : 0;
      last = scrollY;
      if (still >= 3 || performance.now() - started > 2000) resolve();
      else requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

async function open(page, path, expectedStatus) {
  const response = await page.goto(`${base}${path}`, {
    // "load", not "networkidle": viewport prefetching of the many links
    // can keep the network busy for longer than the navigation timeout.
    waitUntil: "load",
  });
  assert.equal(response?.status(), expectedStatus, `${path} status`);
  await page.evaluate(() => document.fonts.ready);
}

async function checkSkipLink(page, path, status) {
  await open(page, path, status);
  await page.keyboard.press("Tab");
  const first = await page.evaluate(describeFocus);
  await page.keyboard.press("Enter");
  const after = await page.evaluate(describeFocus);
  const problem = skipLinkProblem(first, after);
  return problem ? [problem] : [];
}

async function checkTabStops(page, path, status, width) {
  await page.setViewportSize({ width, height: 1000 });
  await open(page, path, status);
  const problems = [];
  let previous = null;
  let repeated = 0;
  for (let i = 0; i < maxTabStops; i += 1) {
    await page.keyboard.press("Tab");
    // html scrolls smoothly without reduced motion: let the scroll that
    // brings the focused element into view finish before measuring it.
    await page.evaluate(settleScroll);
    const stop = await page.evaluate(describeFocus);
    if (!stop) break; // focus left the document: the page is done
    if (sameTabStop(previous, stop)) {
      repeated += 1;
      if (repeated >= 2) {
        problems.push(`${width}px: focus trap at ${stop.label}`);
        break;
      }
    } else repeated = 0;
    const problem = focusIndicatorProblem(stop);
    if (problem) problems.push(`${width}px: ${problem}`);
    previous = stop;
  }
  return problems;
}

async function checkMenu(page, route, width) {
  const { path, status } = route;
  const required = menuRequired(route, width);
  await page.setViewportSize({ width, height: 1000 });
  await open(page, path, status);
  const button = page
    .locator("header button[aria-expanded][aria-controls]")
    .filter({ visible: true })
    .first();
  const found = (await button.count()) > 0;
  const state = () =>
    button.evaluate((element) => {
      const panel = document.getElementById(
        element.getAttribute("aria-controls") ?? "",
      );
      const active = document.activeElement;
      const rect = active?.getBoundingClientRect();
      return {
        expanded: element.getAttribute("aria-expanded") === "true",
        panelVisible: Boolean(panel && panel.getClientRects().length > 0),
        insidePanel: Boolean(panel && active && panel.contains(active)),
        visible: Boolean(rect && rect.width > 0 && rect.height > 0),
        focusOnButton: active === element,
      };
    });
  if (!found) {
    const problem = menuProblem({ found }, required);
    return problem ? [`${width}px: ${problem}`] : [];
  }
  await button.focus();
  await page.keyboard.press("Enter");
  let opened = await state();
  // The button works only after hydration, which may follow "load".
  for (let i = 0; i < 20 && !opened.expanded; i += 1) {
    await page.waitForTimeout(250);
    await button.focus();
    await page.keyboard.press("Enter");
    opened = await state();
  }
  await page.keyboard.press("Tab");
  const firstStop = await state();
  await page.keyboard.press("Escape");
  let closed = await state();
  // Focus may already have left the panel's first item for the button.
  if (!closed.focusOnButton && !closed.expanded) {
    await page.waitForTimeout(50);
    closed = await state();
  }
  const problem = menuProblem({ found, opened, firstStop, closed }, required);
  return problem ? [`${width}px: ${problem}`] : [];
}

async function checkWidths(page, path, status, name) {
  const problems = [];
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page, path, status);
  for (const width of viewportWidths) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(100);
    const overflow = overflowProblem(
      await page.evaluate(() => ({
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
      })),
    );
    if (overflow) problems.push(overflow);
    const axe = await new AxeBuilder({ page }).withTags([...axeTags]).analyze();
    for (const line of axeProblems(axe.violations))
      problems.push(`${width}px: ${line}`);
    await page.screenshot({ path: `${output}/${name}-${width}.png` });
  }
  return problems;
}

async function checkReducedMotion(page, path, status) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await open(page, path, status);
    return reducedMotionProblems(
      await page.evaluate(() => ({
        scrollBehavior: getComputedStyle(document.documentElement)
          .scrollBehavior,
        elements: [...document.querySelectorAll("body *")].map((element) => {
          const style = getComputedStyle(element);
          return {
            label: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}`,
            animationName: style.animationName,
            animationDuration: style.animationDuration,
            transitionDuration: style.transitionDuration,
          };
        }),
      })),
    );
  } finally {
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
}

/** The route renders its fixture content (see `fixtureRoutes`). */
async function checkContent(page, route) {
  if (!route.requiredContent && !route.forbiddenContent) return [];
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page, route.path, route.status);
  const found = {};
  for (const { selector, text } of route.requiredContent ?? []) {
    const texts = await page
      .locator(selector)
      .evaluateAll((elements) => elements.map((e) => e.textContent ?? ""));
    found[`${selector} ${text}`] = texts.some((value) => value.includes(text));
  }
  const bodyText = await page.evaluate(() => document.body.textContent ?? "");
  return contentProblems(route, found, bodyText);
}

async function checkRoute(route) {
  const { path, status, type } = route;
  const page = await context.newPage();
  page.on("pageerror", (error) =>
    pageErrors.push({ path, error: String(error) }),
  );
  page.on("response", (response) => {
    if (response.url().startsWith(base) && response.status() >= 500)
      serverErrors.push({ url: response.url(), status: response.status() });
  });
  const name = path === "/" ? "home" : path.slice(1).replace(/\//g, "_");
  const problems = [];
  const steps = [
    () => checkContent(page, route),
    () => checkSkipLink(page, path, status),
    () => checkTabStops(page, path, status, 1440),
    () => checkTabStops(page, path, status, 390),
    ...menuCheckWidths.map((width) => () => checkMenu(page, route, width)),
    () => checkWidths(page, path, status, name),
    () => checkReducedMotion(page, path, status),
  ];
  for (const step of steps) {
    try {
      problems.push(...(await step()));
    } catch (error) {
      problems.push(`error: ${error instanceof Error ? error.message : error}`);
    }
  }
  await page.close();
  rows.push({ path, type, status, problems });
  console.log(`${problems.length ? "FAIL" : "ok  "} ${type} ${path}`);
  for (const problem of problems) console.log(`     ${problem}`);
}

const skippedDetails = [];
try {
  for (const route of plan.routes) await checkRoute(route);
  const finder = await context.newPage();
  for (const { list, prefix, type } of detailRoutes) {
    await open(finder, list, 200);
    const hrefs = await finder
      .locator("main a[href]")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    const path = pickDetailPath(hrefs, prefix);
    // A static build may publish no item; the list's empty state was
    // checked above, and the report records the skipped detail type. The
    // fixture run (or A11Y_REQUIRE_DETAILS=1) fails on it below.
    if (path) await checkRoute({ path, status: 200, type });
    else skippedDetails.push({ type, list, reason: "no published item" });
  }
  await finder.close();
} finally {
  await browser.close();
}

const failed = rows.filter((row) => row.problems.length > 0);
const detailProblems = skippedDetailsProblems(skippedDetails, requireDetails);
for (const problem of detailProblems) console.log(`FAIL ${problem}`);
const report = {
  origin: base,
  widths: viewportWidths,
  axeTags,
  checkedRoutes: rows.length,
  failedRoutes: failed.length,
  requireDetails,
  skippedDetails,
  detailProblems,
  serverErrors,
  pageErrors,
  rows,
};
await writeFile(`${output}/a11y.json`, JSON.stringify(report, null, 2));
console.log(
  JSON.stringify(
    { ...report, rows: undefined, failed: failed.map((r) => r.path) },
    null,
    2,
  ),
);
assert.equal(
  failed.length +
    detailProblems.length +
    serverErrors.length +
    pageErrors.length,
  0,
);
