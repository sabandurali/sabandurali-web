import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  axeProblems,
  axeTags,
  contactFormFields,
  contactFormProblems,
  contentProblems,
  detailRoutes,
  fixtureRoutes,
  focusIndicatorProblem,
  headerMenuBreakpoint,
  localOriginProblem,
  maxDurationMs,
  menuCheckWidths,
  menuProblem,
  menuRequired,
  overflowProblem,
  pickDetailPath,
  publicRoutes,
  reducedMotionProblems,
  routePlan,
  sameTabStop,
  skipLinkHydrated,
  skipLinkProblem,
  skippedDetailsProblems,
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

/** URL pattern of every page.tsx in the TR and EN public route groups. */
function publicPagePatterns() {
  const patterns = [];
  const walk = (directory, url) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        // A route group "(name)" adds no URL segment.
        const segment = entry.name.startsWith("(") ? "" : `/${entry.name}`;
        walk(`${directory}/${entry.name}`, `${url}${segment}`);
      } else if (entry.name === "page.tsx") patterns.push(url || "/");
    }
  };
  walk("src/app/(tr)", "");
  walk("src/app/(en)/en", "/en");
  return patterns.sort();
}

/** Whether a concrete path is an instance of a route pattern. */
function matchesPattern(pattern, path) {
  const want = pattern.split("/").filter(Boolean);
  const have = path.split("/").filter(Boolean);
  for (let i = 0; i < want.length; i += 1) {
    if (/^\[\.\.\..+\]$/.test(want[i])) return have.length > i;
    if (have[i] === undefined) return false;
    if (!/^\[.+\]$/.test(want[i]) && want[i] !== have[i]) return false;
  }
  return want.length === have.length;
}

// Workspace hubs rendered by the same template as /arastirma-ve-analiz
// (checked below), so its hub and section stand for them.
const workspaceTemplate = "arastirma-ve-analiz";
const sameWorkspaceTemplate = [
  "fotograf",
  "gayrimenkul-ve-istanbul",
  "kitaplar-ve-ogrenme",
  "satis-ve-muzakere",
  "yapay-zeka-ve-teknoloji",
];
// Route types the static CI build cannot render, because they only exist for
// CMS content: they stay listed here until a fixture build covers them.
const notInStaticBuild = ["/[slug]"];

test("every public page route of the app is covered by a route type", () => {
  // A new public page.tsx fails here until publicRoutes, detailRoutes or
  // one of the lists above names it.
  const uncovered = publicPagePatterns().filter((pattern) => {
    if (notInStaticBuild.includes(pattern)) return false;
    const [, first, ...rest] = pattern.split("/");
    const effective = sameWorkspaceTemplate.includes(first)
      ? ["", workspaceTemplate, ...rest].join("/")
      : pattern;
    const catchAll = /\[\.\.\./.test(effective);
    return !(
      publicRoutes.some(
        ({ path, status }) =>
          (catchAll ? status === 404 : status === 200) &&
          matchesPattern(effective, path),
      ) ||
      detailRoutes.some(({ prefix }) =>
        matchesPattern(effective, `${prefix}item`),
      )
    );
  });
  assert.deepEqual(uncovered, []);
});

test("the workspace hubs named as one template really share it", () => {
  const normalized = (hub, file) =>
    readFileSync(`src/app/(tr)/${hub}/${file}`, "utf8")
      .replaceAll(hub, "HUB")
      .replace(/export default function \w+/, "export default function Page")
      // Prettier wraps differently for names of different length.
      .replace(/\s+/g, " ")
      .replace(/return \( (<.*?\/>) \);/g, "return $1;")
      .replace(/([({]) /g, "$1")
      .replace(/,? ([)}])/g, "$1");
  for (const hub of sameWorkspaceTemplate)
    for (const file of ["page.tsx", "[section]/page.tsx"])
      assert.equal(
        normalized(hub, file),
        normalized(workspaceTemplate, file),
        `${hub}/${file} differs from the ${workspaceTemplate} template`,
      );
});

test("the route pattern matcher", () => {
  assert.ok(matchesPattern("/", "/"));
  assert.ok(matchesPattern("/makaleler/[slug]", "/makaleler/a"));
  assert.ok(!matchesPattern("/makaleler/[slug]", "/makaleler"));
  assert.ok(!matchesPattern("/makaleler", "/makaleler/a"));
  assert.ok(matchesPattern("/en/[...missing]", "/en/a/b"));
  assert.ok(!matchesPattern("/en/[...missing]", "/en"));
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
      ancestors: [none, ring],
    }),
    null,
  );
  // An ancestor's shadow alone may be permanent (a shadowed card): it is
  // no focus indicator for a link inside it.
  assert.match(
    focusIndicatorProblem({
      label: "a",
      visible: true,
      style: none,
      ancestors: [none, { ...none, boxShadow: "rgb(0, 0, 0) 0px 2px 8px 0px" }],
    }),
    /no visible focus indicator/,
  );
  // The element's own shadow (the focus halo) does count.
  assert.equal(
    focusIndicatorProblem({
      label: "a",
      visible: true,
      style: { ...none, boxShadow: "rgb(255, 255, 255) 0px 0px 0px 3px" },
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
  // FRONTEND-6: the "Menü" disclosure is the only navigation up to 1279 px.
  assert.equal(menuRequired({ type: "home" }, 1100), true);
  assert.equal(menuRequired({ type: "home" }, 1279), true);
  assert.equal(menuRequired({ type: "home" }, 1280), false);
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
  // A duration without an animation name animates nothing: no problem.
  assert.deepEqual(
    reducedMotionProblems({
      scrollBehavior: "auto",
      elements: [{ ...still, animationDuration: "2s" }],
    }),
    [],
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

test("FRONTEND-6: the menu threshold is the header's own breakpoint", () => {
  const header = readFileSync(
    "src/components/layout/HeaderNavigation.tsx",
    "utf8",
  );
  // The disclosure hides and the desktop bar appears at Tailwind's `xl`.
  assert.match(header, /className="xl:hidden"/);
  assert.match(header, /className="hidden[^"]*\bxl:block"/);
  // `xl` keeps Tailwind's default of 80rem = 1280 px (no theme override).
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.doesNotMatch(css, /--breakpoint-xl\s*:/);
  assert.equal(headerMenuBreakpoint, 80 * 16);
  // The check runs below and above the breakpoint, and between lg and xl.
  assert.ok(menuCheckWidths.some((width) => width < 768));
  assert.ok(menuCheckWidths.some((width) => width >= 1024 && width < 1280));
  assert.ok(menuCheckWidths.some((width) => width >= 1280));
});

test("TESTS-INFRA-1: a fixture run must reach every detail template", () => {
  const skipped = [
    { type: "book detail", list: "/kitaplar", reason: "no published item" },
  ];
  assert.deepEqual(skippedDetailsProblems(skipped, false), []);
  assert.deepEqual(skippedDetailsProblems(skipped, true), [
    "book detail: no published item linked from /kitaplar",
  ]);
  assert.deepEqual(skippedDetailsProblems([], true), []);
  // The static run keeps every public route; the fixture run adds the CMS
  // block page and the filled district news list, and requires details.
  assert.deepEqual(routePlan(false), {
    routes: publicRoutes,
    requireDetails: false,
  });
  assert.deepEqual(routePlan(true), {
    routes: fixtureRoutes,
    requireDetails: true,
  });
  const types = fixtureRoutes.map(({ type }) => type);
  assert.ok(types.includes("CMS block page"));
  assert.ok(types.includes("district news (filled)"));
});

test("FRONTEND-2 / TESTS-INFRA-3: the fixture run checks the filled district guide and the CMS navigation", () => {
  const guide = fixtureRoutes.find(
    ({ type }) => type === "district guide (filled)",
  );
  assert.ok(guide, "the filled district guide is not a fixture route");
  assert.equal(guide.path, "/istanbul/ilceler/esenler");
  const required = guide.requiredContent.map(({ selector }) => selector);
  // Every filled part of the guide that the review found untested, plus
  // the CMS header and footer.
  for (const selector of [
    "#genel-bakis",
    "#genel-bakis dl",
    "#yasam",
    "#mahalleler",
    "#imar",
    "#kareler",
    "#kaynaklar",
    "header",
    "footer",
  ])
    assert.ok(required.includes(selector), selector);
  assert.ok(guide.forbiddenContent.length > 0);
  // The static run keeps the guide empty and never asks for fixture texts.
  assert.ok(publicRoutes.every((route) => !route.requiredContent));
});

test("a focus trap is the same element twice, not two links with one label", () => {
  const source = (x, y) => ({
    label: 'a "[1]Kaynak 1" #kaynak-1',
    position: { x, y },
  });
  // The filled guide's fact rows each link "[1] Kaynak 1": focus moves on.
  assert.equal(sameTabStop(source(105, 1822), source(67, 1996)), false);
  assert.equal(sameTabStop(source(67, 1996), source(67, 1996)), true);
  assert.equal(sameTabStop(null, source(67, 1996)), false);
});

test("contentProblems reports a missing fixture text and a private text", () => {
  const route = {
    requiredContent: [
      { selector: "#imar", text: "row" },
      { selector: "header", text: "menu" },
    ],
    forbiddenContent: ["private note"],
  };
  assert.deepEqual(
    contentProblems(route, { "#imar row": true, "header menu": true }, "page"),
    [],
  );
  assert.deepEqual(
    contentProblems(
      route,
      { "#imar row": false, "header menu": true },
      "page with a private note",
    ),
    [
      'missing content in #imar: "row"',
      'forbidden content rendered: "private note"',
    ],
  );
  assert.deepEqual(contentProblems({}, {}, "anything"), []);
});

test("the keyboard checks wait for the hydrated skip link", () => {
  const root = (link) => ({ querySelector: () => link });
  // Server markup only: no React props yet, so the check keeps waiting.
  assert.equal(skipLinkHydrated(root({ href: "#main" })), false);
  assert.equal(skipLinkHydrated(root(null)), false);
  assert.equal(
    skipLinkHydrated(root({ href: "#main", __reactProps$abc: {} })),
    true,
  );
});

/** A form snapshot where the given fields show the given messages. */
function formState(focused, messages) {
  return {
    focused,
    fields: Object.fromEntries(
      contactFormFields.map((field) => {
        const text = messages[field];
        return [
          field,
          { invalid: text !== undefined, messages: text ? [text] : [] },
        ];
      }),
    ),
  };
}

const allMissing = {
  name: "Hata: Adınızı yazın.",
  email: "Hata: E-posta adresinizi yazın.",
  subject: "Hata: Bir konu seçin.",
  message: "Hata: Mesajınızı yazın.",
  privacyAcknowledgement: "Hata: Aydınlatma metnini onaylayın.",
};
const withoutName = { ...allMissing, name: undefined };
const goodContactForm = {
  submitted: formState("name", allMissing),
  nameFixed: formState("name", withoutName),
  messageShort: formState("message", {
    ...withoutName,
    message: "Hata: Mesajınız en az 10 karakter olmalı.",
  }),
  externalRequests: [],
};

test("TESTS-INFRA-4: the contact form check runs on both contact pages", () => {
  assert.deepEqual(
    publicRoutes
      .filter((route) => route.contactForm)
      .map(({ path, contactForm }) => [path, contactForm]),
    [
      ["/iletisim", "tr"],
      ["/en/contact", "en"],
    ],
  );
  // Every field ContactForm.tsx renders, in its visual order.
  const form = readFileSync("src/components/forms/ContactForm.tsx", "utf8");
  const names = [...form.matchAll(/\bname="(\w+)"/g)]
    .map(([, name]) => name)
    .filter((name) => !["language", "formType"].includes(name));
  const acknowledgement = readFileSync(
    "src/components/forms/PrivacyAcknowledgement.tsx",
    "utf8",
  );
  assert.match(acknowledgement, /name="privacyAcknowledgement"/);
  assert.deepEqual([...names, "privacyAcknowledgement"], contactFormFields);
});

test("TESTS-INFRA-4: correct error handling passes", () => {
  assert.deepEqual(contactFormProblems(goodContactForm, "tr"), []);
  const english = formState("name", {
    ...allMissing,
    name: "Error: Enter your name.",
  });
  assert.ok(
    contactFormProblems({ ...goodContactForm, submitted: english }, "en").some(
      (problem) =>
        problem.includes('email has no aria-invalid with a visible "Error:"'),
    ),
  );
});

test("TESTS-INFRA-4: lost focus, missing or stale messages and requests fail", () => {
  const problems = (change) =>
    contactFormProblems({ ...goodContactForm, ...change }, "tr");
  // The focus effect was removed: focus stays on the submit button.
  assert.match(
    problems({ submitted: { ...goodContactForm.submitted, focused: null } })[0],
    /focus is on nothing, not the first invalid field/,
  );
  // aria-describedby no longer reaches the message.
  const unlinked = formState("name", allMissing);
  unlinked.fields.email.messages = [];
  assert.match(
    problems({ submitted: unlinked })[0],
    /email has no aria-invalid/,
  );
  // A message without the spoken prefix is not enough.
  assert.match(
    problems({
      submitted: formState("name", {
        ...allMissing,
        subject: "Bir konu seçin.",
      }),
    })[0],
    /subject has no aria-invalid/,
  );
  // The fixed field keeps its message.
  assert.match(
    problems({ nameFixed: formState("name", allMissing) })[0],
    /its message stays after the field was fixed/,
  );
  // Typing moved focus somewhere else.
  assert.match(
    problems({ nameFixed: formState("email", withoutName) })[0],
    /typing moved focus to email/,
  );
  // Fixing one field dropped another field's message.
  const withoutNameAndEmail = { ...withoutName, email: undefined };
  assert.match(
    problems({ nameFixed: formState("name", withoutNameAndEmail) })[0],
    /the email message disappeared/,
  );
  // The changed message field keeps the old text.
  assert.match(
    problems({ messageShort: formState("message", withoutName) })[0],
    /the message text was not updated/,
  );
  assert.match(
    problems({ externalRequests: ["https://formspree.io/f/x"] })[0],
    /an invalid form sent requests: https:\/\/formspree\.io\/f\/x/,
  );
});
