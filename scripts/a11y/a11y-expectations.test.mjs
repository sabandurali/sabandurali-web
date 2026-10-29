import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  axeProblems,
  axeTags,
  detailRoutes,
  focusIndicatorProblem,
  localOriginProblem,
  maxDurationMs,
  menuProblem,
  menuRequired,
  overflowProblem,
  pickDetailPath,
  publicRoutes,
  reducedMotionProblems,
  skipLinkProblem,
  viewportWidths,
} from "./a11y-expectations.mjs";

test("covers the Definition of Done widths and WCAG 2.2 AA tags", () => {
  assert.deepEqual([...viewportWidths], [390, 820, 1440]);
  for (const tag of ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    assert.ok(axeTags.includes(tag), tag);
});

test("covers every public route type in TR and EN, including not-found", () => {
  const paths = publicRoutes.map(({ path }) => path);
  for (const path of [
    "/",
    "/makaleler",
    "/kitaplar",
    "/fotograflar",
    "/iletisim",
    "/istanbul/ilceler",
    "/en",
    "/en/articles",
    "/en/books",
    "/en/photography",
    "/en/contact",
  ])
    assert.ok(paths.includes(path), path);
  assert.deepEqual(
    publicRoutes.filter(({ status }) => status === 404).map(({ type }) => type),
    ["TR not found", "global not found", "EN not found"],
  );
  assert.equal(new Set(paths).size, paths.length);
  assert.equal(detailRoutes.length, 6);
});

test("every public page route of the app is covered by a route type", () => {
  // A new top-level public page must be added to publicRoutes.
  const covered = new Set(
    [
      ...publicRoutes.map(({ path }) => path),
      ...detailRoutes.map((d) => d.list),
    ].map(
      (path) =>
        path
          .split("/")
          .slice(0, path.startsWith("/en") ? 3 : 2)
          .join("/") || "/",
    ),
  );
  for (const route of [
    "/",
    "/makaleler",
    "/kitaplar",
    "/fotograflar",
    "/hakkimda",
    "/iletisim",
    "/istanbul",
    "/en",
    "/en/articles",
    "/en/books",
    "/en/photography",
    "/en/contact",
    "/en/privacy-notice",
  ])
    assert.ok(covered.has(route), route);
});

test("refuses non-local origins", () => {
  assert.equal(localOriginProblem("http://127.0.0.1:3101"), null);
  assert.equal(localOriginProblem("http://localhost:3017"), null);
  assert.ok(localOriginProblem("https://www.sabandurali.com"));
  assert.ok(localOriginProblem("http://127.0.0.1.example.com:80"));
});

test("picks the first detail link one segment below the list", () => {
  assert.equal(
    pickDetailPath(
      [
        "/makaleler",
        "/makaleler/a/b",
        "/makaleler/ilk-yazi#x",
        "/makaleler/ikinci",
      ],
      "/makaleler/",
    ),
    "/makaleler/ilk-yazi",
  );
  assert.equal(
    pickDetailPath(["/kitaplar", "/en/books/x"], "/kitaplar/"),
    null,
  );
});

test("flags horizontal scroll beyond one pixel of rounding", () => {
  assert.equal(overflowProblem({ width: 390, scrollWidth: 391 }), null);
  assert.match(
    overflowProblem({ width: 390, scrollWidth: 412 }),
    /horizontal scroll at 390px/,
  );
});

test("every axe violation fails, without an allowlist", () => {
  assert.deepEqual(axeProblems([]), []);
  const [line] = axeProblems([
    {
      id: "color-contrast",
      impact: "serious",
      nodes: [{ target: ["main", "p.lead"] }, { target: ["footer a"] }],
    },
  ]);
  assert.match(
    line,
    /color-contrast \(serious, 2 node\(s\)\): main p\.lead \| footer a/,
  );
});

test("the first Tab stop must be a visible skip link into <main>", () => {
  const first = {
    tag: "a",
    href: "#main",
    text: "İçeriğe geç",
    visible: true,
  };
  assert.equal(skipLinkProblem(first, { insideMain: true }), null);
  assert.equal(
    skipLinkProblem(
      { ...first, text: "Skip to content" },
      { insideMain: true },
    ),
    null,
  );
  assert.match(skipLinkProblem(null, null), /not a link/);
  assert.match(
    skipLinkProblem({ ...first, href: "/" }, { insideMain: true }),
    /not a skip link/,
  );
  assert.match(
    skipLinkProblem({ ...first, text: "Ana sayfa" }, { insideMain: true }),
    /unexpected label/,
  );
  assert.match(
    skipLinkProblem({ ...first, visible: false }, { insideMain: true }),
    /not visible/,
  );
  assert.match(
    skipLinkProblem(first, { insideMain: false }),
    /does not move focus/,
  );
});

test("a focus stop needs its own or a close ancestor's indicator", () => {
  const none = { outlineStyle: "none", outlineWidth: "0px", boxShadow: "none" };
  const ring = {
    outlineStyle: "solid",
    outlineWidth: "3px",
    boxShadow: "none",
  };
  assert.equal(
    focusIndicatorProblem({ label: "a", visible: true, style: ring }),
    null,
  );
  assert.equal(
    focusIndicatorProblem({
      label: "a",
      visible: true,
      style: none,
      ancestors: [
        none,
        { ...none, boxShadow: "rgb(255, 255, 255) 0px 0px 0px 3px" },
      ],
    }),
    null,
  );
  assert.match(
    focusIndicatorProblem({
      label: "a",
      visible: true,
      style: none,
      ancestors: [none],
    }),
    /no visible focus indicator/,
  );
  assert.match(
    focusIndicatorProblem({
      label: "a",
      visible: true,
      style: { ...ring, outlineWidth: "1px" },
    }),
    /no visible focus indicator/,
  );
  assert.match(
    focusIndicatorProblem({ label: "a", visible: false, style: ring }),
    /not visible/,
  );
});

test("the header menu opens, is reachable and closes from the keyboard", () => {
  const good = {
    found: true,
    opened: { expanded: true, panelVisible: true },
    firstStop: { insidePanel: true, visible: true },
    closed: { expanded: false, focusOnButton: true },
  };
  assert.equal(menuProblem(good), null);
  assert.equal(menuProblem(good, true), null);
  assert.match(menuProblem({ found: false }, true), /no header menu button/);
  assert.equal(menuProblem({ found: false }, false), null);
  assert.equal(menuRequired({ type: "EN home" }, 390), true);
  assert.equal(menuRequired({ type: "EN home" }, 1440), false);
  assert.equal(menuRequired({ type: "global not found" }, 390), false);
  assert.match(
    menuProblem({ ...good, opened: { expanded: true, panelVisible: false } }),
    /does not open/,
  );
  assert.match(
    menuProblem({ ...good, firstStop: { insidePanel: false, visible: true } }),
    /does not reach/,
  );
  assert.match(
    menuProblem({ ...good, closed: { expanded: true, focusOnButton: true } }),
    /Escape does not close/,
  );
  assert.match(
    menuProblem({ ...good, closed: { expanded: false, focusOnButton: false } }),
    /return focus/,
  );
});

test("reduced motion allows only the 0.01 ms override", () => {
  assert.equal(maxDurationMs("0.3s, 150ms"), 300);
  assert.equal(maxDurationMs("1e-05s"), 0.01);
  assert.equal(maxDurationMs(""), 0);
  const still = {
    label: "div",
    animationName: "none",
    animationDuration: "0s",
    transitionDuration: "1e-05s",
  };
  assert.deepEqual(
    reducedMotionProblems({ scrollBehavior: "auto", elements: [still] }),
    [],
  );
  assert.equal(
    reducedMotionProblems({
      scrollBehavior: "smooth",
      elements: [
        still,
        { ...still, label: "nav", transitionDuration: "0.2s" },
        {
          ...still,
          label: "span",
          animationName: "pulse",
          animationDuration: "1s",
        },
      ],
    }).length,
    3,
  );
});

test("CI runs the public accessibility check against the local build", () => {
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts["e2e:a11y"], "node scripts/a11y/public-routes.mjs");
  assert.match(pkg.devDependencies["@axe-core/playwright"], /^\d+\.\d+\.\d+$/);
  assert.match(workflow, /run: npm run e2e:a11y/);
  assert.match(workflow, /A11Y_TEST_URL: http:\/\/127\.0\.0\.1:3101/);
});
