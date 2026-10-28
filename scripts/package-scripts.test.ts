import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const { scripts } = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts: Record<string, string>;
};

// Tools that need a running server, a browser or a prepared database.
const environmentTools = [
  "scripts/security-headers-check.mjs",
  "scripts/content-trust-routes.mjs",
  "scripts/districts/acceptance.mjs",
  "scripts/districts/check-cms.ts",
];

function referencedFiles(command: string): string[] {
  return [...command.matchAll(/\bscripts\/[\w./-]+\.(?:[cm]?[jt]s|py)\b/g)].map(
    (match) => match[0],
  );
}

test("every npm script points at an existing file", () => {
  const missing = Object.entries(scripts).flatMap(([name, command]) =>
    referencedFiles(command)
      .filter((file) => !existsSync(file))
      .map((file) => `${name}: ${file}`),
  );
  assert.deepEqual(missing, []);
});

test("ARC-9: test scripts run without a server, browser or prepared database", () => {
  for (const [name, command] of Object.entries(scripts)) {
    if (name !== "test" && !name.startsWith("test:")) continue;
    for (const tool of environmentTools) {
      assert.ok(!command.includes(tool), `${name} runs ${tool}`);
    }
  }
  for (const tool of environmentTools) {
    assert.ok(
      Object.entries(scripts).some(
        ([name, command]) => name.startsWith("e2e:") && command.includes(tool),
      ),
      `${tool} has an e2e:* script`,
    );
  }
  assert.equal(
    scripts.test,
    "npm run test:unit && npm run test:districts:content && npm run test:migrations",
  );
});

test("SEC-24: archived Production importers have no npm script", () => {
  for (const [name, command] of Object.entries(scripts)) {
    assert.ok(!command.includes("scripts/districts/archive/"), name);
    assert.ok(!name.startsWith("district:import:production"), name);
  }
});
