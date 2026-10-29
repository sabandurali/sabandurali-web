import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// The CI workflow must exercise the built application, not only compile it:
// the e2e scripts run against the production build served on 127.0.0.1.
const workflow = readFileSync(".github/workflows/ci.yml", "utf8");

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
