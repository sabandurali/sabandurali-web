import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { publicRoutes } from "../a11y/a11y-expectations.mjs";
import {
  fonts,
  totalMaxBytes as fontFilesMaxBytes,
} from "../fonts/subset-fonts.mjs";
import {
  budget,
  budgetProblems,
  budgetRoutes,
  bytesByKind,
  cumulativeLayoutShift,
  resourceKind,
} from "./budget-expectations.mjs";

const workflow = readFileSync(".github/workflows/ci.yml", "utf8");

test("PERF-CI-BUDGET: every rendered page type of the a11y check is measured", () => {
  assert.deepEqual(
    budgetRoutes.map((route) => route.path),
    publicRoutes
      .filter((route) => route.status === 200)
      .map((route) => route.path),
  );
  assert.ok(budgetRoutes.some((route) => route.path === "/"));
  assert.ok(budgetRoutes.some((route) => route.path === "/en"));
});

test("PERF-CI-BUDGET: the font budget holds the font files of PERF-FONTS", () => {
  assert.equal(budget.fontBytes, 100 * 1024);
  assert.ok(fontFilesMaxBytes <= budget.fontBytes);
  assert.equal(fonts.length, 2);
  assert.ok(budget.lcpMs <= 2500 && budget.cls <= 0.25);
});

test("resources are counted by kind from their compressed size", () => {
  assert.equal(
    resourceKind("http://127.0.0.1:3101/_next/static/media/a.woff2"),
    "font",
  );
  assert.equal(
    resourceKind("http://127.0.0.1:3101/_next/static/chunks/a.js?v=1"),
    "script",
  );
  assert.equal(
    resourceKind("http://127.0.0.1:3101/_next/static/chunks/a.css"),
    "style",
  );
  assert.equal(resourceKind("http://127.0.0.1:3101/feed.xml"), "other");
  assert.deepEqual(
    bytesByKind([
      { name: "http://x.test/a.woff2", encodedBodySize: 10 },
      { name: "http://x.test/b.woff2", encodedBodySize: 5 },
      { name: "http://x.test/c.js", encodedBodySize: 7 },
    ]),
    { font: 15, script: 7, style: 0, other: 0 },
  );
});

test("CLS is the worst session window and ignores shifts after input", () => {
  assert.equal(cumulativeLayoutShift([]), 0);
  const shifts = [
    { value: 0.05, startTime: 100, hadRecentInput: false },
    { value: 0.05, startTime: 600, hadRecentInput: false },
    // A gap over one second starts a new window.
    { value: 0.02, startTime: 3000, hadRecentInput: false },
    { value: 0.5, startTime: 3100, hadRecentInput: true },
  ];
  assert.equal(cumulativeLayoutShift(shifts).toFixed(2), "0.10");
});

test("budget problems name each exceeded limit", () => {
  const ok = {
    fontBytes: 92 * 1024,
    scriptBytes: 170 * 1024,
    lcpMs: 800,
    cls: 0.02,
  };
  assert.deepEqual(budgetProblems(ok), []);
  assert.deepEqual(
    budgetProblems({
      fontBytes: 234 * 1024,
      scriptBytes: 300 * 1024,
      lcpMs: 4000,
      cls: 0.3,
    }),
    [
      "fonts 234.0 KiB > 100.0 KiB",
      "scripts 300.0 KiB > 200.0 KiB",
      "LCP 4000 ms > 2500 ms",
      "CLS 0.300 > 0.25",
    ],
  );
  assert.deepEqual(budgetProblems({ ...ok, lcpMs: null }), [
    "no largest contentful paint",
  ]);
});

test("PERF-CI-BUDGET: CI runs the budget on the local server after the a11y check", () => {
  const a11y = workflow.indexOf("run: npm run e2e:a11y");
  const perf = workflow.indexOf("run: node scripts/perf/budget.mjs");
  assert.ok(a11y >= 0 && perf > a11y, "the budget step follows e2e:a11y");
  const step = workflow.slice(perf).split(/\n\s*- name: /)[0] ?? "";
  assert.match(step, /PERF_TEST_URL: http:\/\/127\.0\.0\.1:3101\n/);
  assert.match(step, /BROWSER_CHANNEL: chromium/);
  assert.match(workflow, /\$\{\{ runner\.temp \}\}\/perf-budget\n/);
});
