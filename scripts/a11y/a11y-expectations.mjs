// Pure expectations of the public accessibility and layout check
// (scripts/a11y/public-routes.mjs). Kept free of Playwright so node:test
// covers every rule without a browser.

/** The three widths of the Definition of Done (CLAUDE.md). */
export const viewportWidths = Object.freeze([390, 820, 1440]);

/** axe-core tags for WCAG 2.0, 2.1 and 2.2 at levels A and AA. */
export const axeTags = Object.freeze([
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
]);

/**
 * One representative URL per public route type, TR and EN, including the
 * not-found pages of both route groups and the global not-found page.
 * Detail pages are discovered from their list (see `detailRoutes`), because
 * a static build may publish no item at all.
 */
export const publicRoutes = Object.freeze([
  { path: "/", status: 200, type: "home" },
  { path: "/makaleler", status: 200, type: "article list" },
  { path: "/kitaplar", status: 200, type: "book list" },
  { path: "/fotograflar", status: 200, type: "photo list" },
  { path: "/iletisim", status: 200, type: "contact" },
  { path: "/hakkimda", status: 200, type: "about" },
  { path: "/hakkimda/biyografi", status: 200, type: "biography" },
  {
    path: "/hakkimda/egitim-sertifikalar-diplomalar",
    status: 200,
    type: "credentials",
  },
  { path: "/kvkk-aydinlatma-metni", status: 200, type: "privacy notice" },
  { path: "/calisma-alanlari", status: 200, type: "work areas" },
  { path: "/arastirma-ve-analiz", status: 200, type: "workspace hub" },
  {
    path: "/arastirma-ve-analiz/veri-ve-analiz",
    status: 200,
    type: "workspace section",
  },
  { path: "/fotograf", status: 200, type: "photo workspace hub" },
  { path: "/istanbul/ilceler", status: 200, type: "district directory" },
  { path: "/istanbul/ilceler/esenler", status: 200, type: "district guide" },
  {
    path: "/istanbul/ilceler/esenler/haberler",
    status: 200,
    type: "district news",
  },
  { path: "/olmayan-sayfa", status: 404, type: "TR not found" },
  { path: "/olmayan/derin/yol", status: 404, type: "global not found" },
  { path: "/en", status: 200, type: "EN home" },
  { path: "/en/articles", status: 200, type: "EN article list" },
  { path: "/en/books", status: 200, type: "EN book list" },
  { path: "/en/photography", status: 200, type: "EN photo list" },
  { path: "/en/contact", status: 200, type: "EN contact" },
  { path: "/en/privacy-notice", status: 200, type: "EN privacy notice" },
  { path: "/en/missing-page", status: 404, type: "EN not found" },
]);

/** Detail route types, reached through the first item of their list. */
export const detailRoutes = Object.freeze([
  { list: "/makaleler", prefix: "/makaleler/", type: "article detail" },
  { list: "/kitaplar", prefix: "/kitaplar/", type: "book detail" },
  { list: "/fotograflar", prefix: "/fotograflar/", type: "photo detail" },
  { list: "/en/articles", prefix: "/en/articles/", type: "EN article detail" },
  { list: "/en/books", prefix: "/en/books/", type: "EN book detail" },
  {
    list: "/en/photography",
    prefix: "/en/photography/",
    type: "EN photo detail",
  },
]);

/**
 * Routes that exist only with the CI fixtures (`npm run ci:seed-fixtures`,
 * scripts/ci/fixture-content.ts): a standard CMS page with every block and
 * a district news list with an item. Checked in fixture mode only.
 */
export const fixtureRoutes = Object.freeze([
  { path: "/ci-test-sayfasi", status: 200, type: "CMS block page" },
  {
    path: "/istanbul/ilceler/esenler/haberler",
    status: 200,
    type: "district news (filled)",
  },
]);

/**
 * The routes of one run. The static build checks every public route type;
 * the fixture run (`A11Y_FIXTURES=1`) checks the templates that only CMS
 * content reaches: the detail pages (discovered from their lists) and the
 * fixture routes above, and it fails when a detail type is not reached.
 */
export function routePlan(fixtures) {
  return fixtures
    ? { routes: fixtureRoutes, requireDetails: true }
    : { routes: publicRoutes, requireDetails: false };
}

/**
 * Detail types that were not reached. A run that must render every detail
 * template (fixture mode or `A11Y_REQUIRE_DETAILS=1`) fails on each of them;
 * otherwise they are only reported.
 */
export function skippedDetailsProblems(skipped, required) {
  return required
    ? skipped.map(
        ({ type, list }) => `${type}: no published item linked from ${list}`,
      )
    : [];
}

/**
 * Width from which the header shows its desktop bar instead of the "Menü"
 * disclosure: Tailwind's `xl` breakpoint (80rem), which HeaderNavigation
 * uses (`xl:hidden` / `xl:block`, docs/DESIGN-SYSTEM.md §5). A test reads
 * both sources, so the two cannot drift apart.
 */
export const headerMenuBreakpoint = 1280;

/** Widths of the header menu check: narrow, between lg and xl, and wide. */
export const menuCheckWidths = Object.freeze([390, 1100, 1440]);

/**
 * Whether the header of a route must offer a keyboard menu at a width: below
 * the desktop breakpoint the header always has its "Menü"/"Menu"
 * disclosure, except on the global not-found page, which renders without
 * the site header.
 */
export function menuRequired(route, width) {
  return width < headerMenuBreakpoint && route.type !== "global not found";
}

/** The check never reaches a deployed origin. */
export function localOriginProblem(origin) {
  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
    ? null
    : `not an explicit local HTTP origin: ${origin}`;
}

/** First same-origin link that is exactly one segment below `prefix`. */
export function pickDetailPath(hrefs, prefix) {
  for (const href of hrefs) {
    const path = href.split(/[?#]/)[0];
    if (!path.startsWith(prefix)) continue;
    const rest = path.slice(prefix.length);
    if (rest && !rest.includes("/")) return path;
  }
  return null;
}

/** Horizontal scroll at a viewport width (one pixel of rounding allowed). */
export function overflowProblem({ width, scrollWidth }) {
  return scrollWidth <= width + 1
    ? null
    : `horizontal scroll at ${width}px: scrollWidth ${scrollWidth}`;
}

/**
 * axe violations as readable lines. Every violation fails: the check has no
 * allowlist, so a regression cannot hide behind an accepted baseline.
 */
export function axeProblems(violations) {
  return violations.map((violation) => {
    const targets = violation.nodes
      .slice(0, 5)
      .map((node) => node.target.join(" "))
      .join(" | ");
    return `axe ${violation.id} (${violation.impact ?? "n/a"}, ${violation.nodes.length} node(s)): ${targets}`;
  });
}

const skipLabel = /İçeriğe geç|Skip to content/;

/**
 * The first Tab stop is the visible skip link to the main content, and
 * activating it moves focus into <main>.
 */
export function skipLinkProblem(first, afterActivation) {
  if (!first || first.tag !== "a") return "first Tab stop is not a link";
  if (!first.href?.startsWith("#")) return "first Tab stop is not a skip link";
  if (!skipLabel.test(first.text ?? ""))
    return `skip link has an unexpected label: ${first.text}`;
  if (!first.visible) return "focused skip link is not visible";
  if (!afterActivation?.insideMain)
    return "activating the skip link does not move focus into <main>";
  return null;
}

/**
 * The first header menu button works from the keyboard: Enter opens its
 * panel, the next Tab lands on a visible element inside it, and Escape
 * closes it and returns focus to the button. A menu is required where the
 * route expects one (`menuRequired`); the wide English header and the
 * global not-found page have plain links only, which the Tab check covers.
 */
export function menuProblem({ found, opened, firstStop, closed }, required) {
  if (!found)
    return required
      ? "no header menu button (button[aria-expanded][aria-controls])"
      : null;
  if (!opened?.expanded || !opened.panelVisible)
    return "Enter does not open the header menu";
  if (!firstStop?.insidePanel || !firstStop.visible)
    return "Tab after opening does not reach a visible menu item";
  if (closed?.expanded || !closed?.focusOnButton)
    return "Escape does not close the menu and return focus to its button";
  return null;
}

function pixels(value) {
  const number = Number.parseFloat(value ?? "");
  return Number.isFinite(number) ? number : 0;
}

/**
 * A focused element shows an indicator: its own outline or box shadow, or
 * the outline of a close ancestor (a card that shows the focus of its title
 * link through the `focus-ring` utility, which always draws an outline). An
 * ancestor's box shadow alone does not count: a card may carry a permanent
 * shadow, which says nothing about focus.
 */
export function focusIndicatorProblem(stop) {
  const outlined = (style) =>
    style.outlineStyle !== "none" && pixels(style.outlineWidth) >= 2;
  const ownIndicator = (style) =>
    outlined(style) || (style.boxShadow && style.boxShadow !== "none");
  if (!stop.visible) return `focused element is not visible: ${stop.label}`;
  if (ownIndicator(stop.style) || (stop.ancestors ?? []).some(outlined))
    return null;
  return `no visible focus indicator: ${stop.label}`;
}

/** Largest duration of a computed CSS time list ("0.3s, 150ms"), in ms. */
export function maxDurationMs(value) {
  if (!value) return 0;
  return Math.max(
    0,
    ...value.split(",").map((part) => {
      const text = part.trim();
      const number = Number.parseFloat(text);
      if (!Number.isFinite(number)) return 0;
      return text.endsWith("ms") ? number : number * 1000;
    }),
  );
}

/**
 * Under `prefers-reduced-motion: reduce` no element animates or transitions
 * for longer than the 0.01 ms of the global override, and the page does not
 * scroll smoothly.
 */
export function reducedMotionProblems({ scrollBehavior, elements }) {
  const problems = [];
  if (scrollBehavior === "smooth")
    problems.push("html keeps smooth scrolling under reduced motion");
  for (const element of elements) {
    const animated =
      element.animationName !== "none" &&
      maxDurationMs(element.animationDuration) > 1;
    const transitioned = maxDurationMs(element.transitionDuration) > 1;
    if (animated || transitioned)
      problems.push(
        `motion under reduced motion: ${element.label} (animation ${element.animationDuration}, transition ${element.transitionDuration})`,
      );
  }
  return problems;
}
