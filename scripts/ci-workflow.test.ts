import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fixturePaths } from "./ci/fixture-content";

// The CI workflow must exercise the built application, not only compile it:
// the e2e scripts run against the production build served on 127.0.0.1.
const workflow = readFileSync(".github/workflows/ci.yml", "utf8");

/** The text of one job, from its key to the next top-level job key. */
function job(name: string): string {
  const start = workflow.indexOf(`\n  ${name}:\n`);
  assert.ok(start >= 0, `job ${name} is missing`);
  const rest = workflow.slice(start + 1);
  const next = rest.slice(1).search(/\n {2}[a-z][\w-]*:\n/);
  return next < 0 ? rest : rest.slice(0, next + 1);
}
const checkJob = job("check");

/** Position of the first line that runs the given command, or -1. */
function runIndex(command: string): number {
  const match = new RegExp(
    `^\\s*(?:-\\s+)?run:\\s*${command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
    "m",
  ).exec(workflow);
  return match?.index ?? -1;
}

test("CI starts the production build locally and runs the e2e checks after it", () => {
  const build = runIndex("npm run build");
  const start = workflow.indexOf(
    "npm run start -- --hostname 127.0.0.1 --port 3101",
  );
  const contentTrust = runIndex("npm run e2e:content-trust");
  const headers = runIndex("npm run e2e:headers -- http://127.0.0.1:3101");
  const routes = runIndex("npm run e2e:districts:routes");
  for (const [name, index] of Object.entries({
    build,
    start,
    contentTrust,
    headers,
    routes,
  }))
    assert.ok(index >= 0, `${name} is missing from ci.yml`);
  assert.ok(build < start, "the server starts after the build");
  // Content trust runs first so the legacy redirects are checked on the
  // first response of a fresh server.
  assert.ok(start < contentTrust && contentTrust < headers);
  assert.ok(headers < routes);
});

test("CI e2e checks target only the local server and stay hermetic", () => {
  for (const [, url] of workflow.matchAll(/DISTRICT_TEST_URL:\s*(\S+)/g))
    assert.equal(url, "http://127.0.0.1:3101");
  assert.match(workflow, /BROWSER_CHANNEL:\s*chromium/);
  assert.match(workflow, /npx playwright install --with-deps chromium/);
  // No secret, deployed origin or production database reaches the job.
  assert.doesNotMatch(workflow, /\$\{\{\s*secrets\./);
  assert.doesNotMatch(workflow, /sabandurali\.com|vercel\.app|neon\.tech/);
  assert.match(workflow, /PAYLOAD_DATABASE: sqlite/);
  assert.match(workflow, /DATABASE_URL: file:\.\/\.data\/ci\.db/);
});

test("CI runs the public accessibility check after the district routes", () => {
  const routes = runIndex("npm run e2e:districts:routes");
  const a11y = runIndex("npm run e2e:a11y");
  assert.ok(a11y >= 0, "e2e:a11y is missing from ci.yml");
  assert.ok(routes < a11y, "Chromium is installed before the a11y check");
  for (const [, url] of checkJob.matchAll(/A11Y_TEST_URL:\s*(\S+)/g))
    assert.equal(url, "http://127.0.0.1:3101");
});

test("TESTS-INFRA-1: CI renders every detail template from seeded fixtures", () => {
  const fixtures = job("fixtures");
  // A hermetic SQLite file, Payload public sources and local media only.
  assert.match(fixtures, /DATABASE_URL: file:\.\/\.data\/ci-fixtures\.db/);
  assert.match(fixtures, /PAYLOAD_DATABASE: sqlite/);
  assert.match(fixtures, /PAYLOAD_STORAGE: local/);
  for (const source of ["ARTICLE", "BOOK", "PAGE", "PHOTO"])
    assert.match(fixtures, new RegExp(`${source}_PUBLIC_SOURCE: payload`));
  assert.doesNotMatch(fixtures, /\$\{\{\s*secrets\./);
  // Seeded before the server starts; the a11y check requires every detail.
  const seed = fixtures.indexOf("run: npm run ci:seed-fixtures");
  const server = fixtures.indexOf("--hostname 127.0.0.1 --port 3102");
  const a11y = fixtures.indexOf("run: npm run e2e:a11y");
  assert.ok(seed >= 0 && seed < server && server < a11y);
  assert.match(fixtures.slice(a11y), /A11Y_FIXTURES: "1"/);
  for (const [, url] of fixtures.matchAll(/A11Y_TEST_URL:\s*(\S+)/g))
    assert.equal(url, "http://127.0.0.1:3102");
  // Every fixture route is compiled before the check.
  const warmUp = new Set(fixtures.match(/(?<=\s)\/[\w/-]*/g) ?? []);
  for (const fixturePath of fixturePaths)
    assert.ok(warmUp.has(fixturePath), fixturePath);
});

test("TESTS-INFRA-3: the fixture job renders the CMS navigation and the filled guide", () => {
  const fixtures = job("fixtures");
  // The district guide follows PAGE_PUBLIC_SOURCE; the header and footer
  // read the seeded Navigation global only with the payload source.
  assert.match(fixtures, /NAVIGATION_PUBLIC_SOURCE: payload/);
  assert.doesNotMatch(fixtures, /NAVIGATION_PUBLIC_SOURCE: static/);
  assert.ok(fixturePaths.includes("/istanbul/ilceler/esenler"));
});

test("CI keeps the e2e evidence as a short-lived, SHA-pinned artifact", () => {
  const start = workflow.indexOf("- name: Upload e2e evidence");
  assert.ok(start >= 0, "the upload step is missing");
  const step = workflow.slice(start).split(/\n\s*- name: /)[0];
  // Uploaded on failure too: that is when the evidence is needed.
  assert.match(step, /if: always\(\)/);
  assert.match(step, /uses: actions\/upload-artifact@[0-9a-f]{40} # v\d+/);
  for (const directory of [
    "content-trust-routes",
    "istanbul-39-acceptance",
    "public-a11y",
  ])
    assert.ok(
      step.includes(`\${{ runner.temp }}/${directory}`),
      `${directory} is not uploaded`,
    );
  const retention = /retention-days:\s*(\d+)/.exec(step)?.[1];
  assert.ok(retention && Number(retention) <= 14, "retention is short");
  // Every action, including this one, is pinned to a full commit SHA.
  for (const [, ref] of workflow.matchAll(/uses:\s*\S+@(\S+)/g))
    assert.match(ref, /^[0-9a-f]{40}$/);
});

test("CI pushes the Payload schema to its SQLite file before the server starts", () => {
  const schema = runIndex("npm run ci:sqlite-schema");
  const start = workflow.indexOf(
    "npm run start -- --hostname 127.0.0.1 --port 3101",
  );
  const headers = runIndex("npm run e2e:headers -- http://127.0.0.1:3101");
  assert.ok(schema >= 0, "ci:sqlite-schema is missing from ci.yml");
  // e2e:headers checks /admin/login, which needs the users table.
  assert.ok(schema < start && start < headers);
});

test("TESTS-INFRA-1: content freshness runs on a schedule, never on a pull request", () => {
  const freshness = readFileSync(
    ".github/workflows/content-freshness.yml",
    "utf8",
  );
  const triggers = /\non:\n([\s\S]*?)\n\S/.exec(freshness)?.[1] ?? "";
  assert.match(triggers, /^\s{2}schedule:/m);
  assert.match(triggers, /^\s{2}workflow_dispatch:/m);
  assert.doesNotMatch(triggers, /pull_request|push/);
  assert.match(freshness, /run: npm run report:districts:freshness/);
  assert.match(freshness, /permissions:\n\s+contents: read/);
  assert.doesNotMatch(freshness, /\$\{\{\s*secrets\./);
  for (const [, ref] of freshness.matchAll(/uses:\s*\S+@(\S+)/g))
    assert.match(ref, /^[0-9a-f]{40}$/);
  // The wall-clock report is never part of the blocking pull request checks.
  assert.ok(!workflow.includes("report:districts:freshness"));
  const { scripts } = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts: Record<string, string>;
  };
  for (const [name, command] of Object.entries(scripts))
    if (name === "test" || name.startsWith("test:") || name === "check")
      assert.ok(!command.includes("report-freshness"), name);
});
