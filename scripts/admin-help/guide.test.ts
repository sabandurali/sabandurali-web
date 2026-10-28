import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { ADMIN_HELP_GUIDE } from "../../src/components/admin/help/admin-help-guide";
import {
  adminGuideGeneratedNotice,
  adminGuideMarkdownPath,
  renderAdminGuideMarkdown,
} from "./guide-markdown";

test("ARC-14: the repository guide is generated from the admin help source", () => {
  const markdown = readFileSync(adminGuideMarkdownPath, "utf8");
  assert.equal(
    markdown,
    renderAdminGuideMarkdown(),
    "Run npm run generate:admin-guide after editing admin-help-guide.ts.",
  );
  assert.ok(markdown.startsWith(adminGuideGeneratedNotice));
  assert.ok(markdown.endsWith(ADMIN_HELP_GUIDE));
});

type RouteSegment =
  | { kind: "static"; value: string }
  | { kind: "dynamic" }
  | { kind: "catchAll"; optional: boolean };

/** The URL patterns of every page and route handler under src/app. */
function appRoutes(
  directory = "src/app",
  segments: RouteSegment[] = [],
): RouteSegment[][] {
  const entries = readdirSync(directory, { withFileTypes: true });
  const routes: RouteSegment[][] = entries.some(
    (entry) => entry.isFile() && /^(?:page|route)\.[jt]sx?$/.test(entry.name),
  )
    ? [segments]
    : [];
  for (const entry of entries) {
    const name = entry.name;
    // Private folders and parallel route slots add no URL segment of their own.
    if (!entry.isDirectory() || name.startsWith("_") || name.startsWith("@"))
      continue;
    const full = path.join(directory, name);
    if (/^\(.+\)$/.test(name)) {
      routes.push(...appRoutes(full, segments));
      continue;
    }
    const segment: RouteSegment = /^\[\[\.\.\..+\]\]$/.test(name)
      ? { kind: "catchAll", optional: true }
      : /^\[\.\.\..+\]$/.test(name)
        ? { kind: "catchAll", optional: false }
        : /^\[.+\]$/.test(name)
          ? { kind: "dynamic" }
          : { kind: "static", value: name };
    routes.push(...appRoutes(full, [...segments, segment]));
  }
  return routes;
}

/**
 * A literal segment must match exactly; a dynamic segment only matches a
 * `[param]` placeholder written in the guide, and an optional catch-all only
 * its empty form (`/admin`). A generic route therefore never hides a typo.
 */
function routeExists(routes: RouteSegment[][], route: string): boolean {
  const parts = route.split("/").filter(Boolean);
  return routes.some((pattern) => {
    let index = 0;
    for (const segment of pattern) {
      if (segment.kind === "catchAll") {
        return segment.optional && index === parts.length;
      }
      const part = parts[index];
      if (part === undefined) return false;
      if (
        segment.kind === "static"
          ? part !== segment.value
          : !/^\[\w+\]$/.test(part)
      )
        return false;
      index += 1;
    }
    return index === parts.length;
  });
}

const routes = appRoutes();
const guideRoutes = [...ADMIN_HELP_GUIDE.matchAll(/`(\/[^`\s]*)`/g)].map(
  (match) => match[1],
);

test("COR-V2: every route the guide names exists in src/app", () => {
  const named = new Set(
    guideRoutes
      // Patterns such as `/{slug}` are checked by the next test.
      .filter((route) => !route.includes("{"))
      .map((route) => route.split("#")[0] || "/"),
  );
  for (const expected of [
    "/",
    "/admin",
    "/en/contact",
    "/makaleler/[slug]",
    "/istanbul/ilceler/[district]",
  ]) {
    assert.ok(named.has(expected), expected);
  }
  assert.deepEqual(
    [...named].filter((route) => !routeExists(routes, route)),
    [],
  );
});

test("the guide's note on generic page routes matches src/app", () => {
  // "Türkçe standart sayfalar için `/{slug}` desteği vardır; genel bir
  // İngilizce `/en/{slug}` route’u yoktur."
  assert.ok(guideRoutes.includes("/{slug}"));
  assert.ok(guideRoutes.includes("/en/{slug}"));
  assert.equal(routeExists(routes, "/[slug]"), true);
  assert.equal(routeExists(routes, "/en/[slug]"), false);
});

test("the route matcher rejects unknown and mistyped routes", () => {
  assert.equal(routeExists(routes, "/en/feedback"), false);
  assert.equal(routeExists(routes, "/geri-bildirim"), false);
  assert.equal(routeExists(routes, "/admin/anything"), false);
  assert.equal(routeExists(routes, "/makaleler/ornek"), false);
});
