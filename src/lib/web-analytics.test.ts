/**
 * Vercel Web Analytics: rendered once in each public root layout, never in
 * the Payload admin; the script and its beacons stay on this origin
 * (`/_vercel/insights/*`), which both Content Security Policies allow; and
 * the package stores nothing in the browser (no cookie, no Web Storage).
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  contentSecurityPolicyDirectives,
  contentSecurityPolicyReportOnlyDirectives,
} from "./securityHeaders";

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

function sourceFiles(directory: string): string[] {
  return readdirSync(path.join(root, directory)).flatMap((name) => {
    const relative = path.join(directory, name);
    return statSync(path.join(root, relative)).isDirectory()
      ? sourceFiles(relative)
      : /\.(tsx?|jsx?|mjs)$/.test(name)
        ? [relative]
        : [];
  });
}

test("each public root layout renders the Next.js Analytics component once", () => {
  for (const layout of ["src/app/(tr)/layout.tsx", "src/app/(en)/layout.tsx"]) {
    const source = read(layout);
    assert.match(
      source,
      /^import \{ Analytics \} from "@vercel\/analytics\/next";$/m,
      layout,
    );
    assert.equal(source.match(/<Analytics\b/g)?.length, 1, layout);
    // Inside <body>, after the page content.
    assert.match(source, /\{children\}[\s\S]*<Analytics \/>[\s\S]*<\/body>/);
  }
});

test("the Payload admin and API load no analytics", () => {
  for (const file of sourceFiles("src/app/(payload)")) {
    assert.doesNotMatch(read(file), /@vercel\/analytics/, file);
  }
});

test("the package is pinned exactly", () => {
  const { dependencies } = JSON.parse(read("package.json")) as {
    dependencies: Record<string, string>;
  };
  assert.match(dependencies["@vercel/analytics"] ?? "", /^\d+\.\d+\.\d+$/);
});

const nextEntry = read("node_modules/@vercel/analytics/dist/next/index.mjs");

test("production analytics load from and report to this origin", () => {
  // The script and the endpoints are root-relative paths; the only absolute
  // URL is the debug script, loaded in development mode only.
  assert.match(nextEntry, /return "\/_vercel\/insights\/script\.js";/);
  const urls = new Set(nextEntry.match(/https:\/\/[\w./-]+/g) ?? []);
  assert.deepEqual([...urls].sort(), [
    "https://va.vercel-scripts.com/v1/script.debug.js",
    "https://vercel.com/docs/analytics/quickstart",
  ]);
  assert.match(
    nextEntry,
    /if \(isDevelopment\(\)\) \{\s*return "https:\/\/va\.vercel-scripts\.com\/v1\/script\.debug\.js";/,
  );
});

test("the analytics package sets no cookie and uses no Web Storage", () => {
  for (const entry of ["next", "react"]) {
    const source = read(
      `node_modules/@vercel/analytics/dist/${entry}/index.mjs`,
    );
    assert.doesNotMatch(
      source,
      /cookie|localStorage|sessionStorage|indexedDB/i,
      entry,
    );
  }
});

test("both Content Security Policies allow the same-origin script and beacons", () => {
  // Enforced: no fetch directive restricts scripts or connections.
  for (const directive of ["default-src", "script-src", "connect-src"]) {
    assert.equal(contentSecurityPolicyDirectives[directive], undefined);
  }
  // Report-Only: 'self' covers /_vercel/insights/script.js and the
  // /_vercel/insights/* beacons, so no violation is reported either.
  for (const directive of ["script-src", "connect-src", "default-src"]) {
    assert.ok(
      contentSecurityPolicyReportOnlyDirectives[directive]?.includes("'self'"),
      directive,
    );
  }
});
