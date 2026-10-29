import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const { devDependencies, scripts } = JSON.parse(
  readFileSync("package.json", "utf8"),
) as {
  devDependencies: Record<string, string>;
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
    "npm run test:unit && npm run test:districts:content",
  );
});

test("ARC-9: the browser and migration replay tools are exact devDependencies", () => {
  // scripts/districts/acceptance.mjs and check-cms.ts load playwright;
  // src/collections/schema-migration.test.ts (npm test) loads PGlite.
  for (const name of ["playwright", "@electric-sql/pglite"]) {
    assert.match(devDependencies[name] ?? "", /^\d+\.\d+\.\d+$/, name);
  }
});

test("SEC-24: archived Production importers have no npm script", () => {
  for (const [name, command] of Object.entries(scripts)) {
    assert.ok(!command.includes("scripts/districts/archive/"), name);
    assert.ok(!name.startsWith("district:import:production"), name);
  }
});

test("migrations are replayed once: by the schema-migration unit test", () => {
  assert.equal(scripts["test:migrations"], undefined);
  for (const [name, command] of Object.entries(scripts))
    assert.ok(!command.includes("check-postgres"), name);
  assert.ok(existsSync("src/collections/schema-migration.test.ts"));
  assert.ok(existsSync("scripts/migration-additive.test.ts"));
});

test(".env.example lists only e2e controls that a script reads", () => {
  const example = readFileSync(".env.example", "utf8");
  assert.doesNotMatch(example, /check-postgres/);
  const block = example
    .split("# Optional controls for the local e2e scripts")[1]
    ?.split("\n\n")[0];
  assert.ok(block, "the e2e controls block is missing");
  const names = [...block.matchAll(/^# ([A-Z_]+)=$/gm)].map(([, name]) => name);
  assert.ok(names.length > 0);
  const sources = environmentTools
    .concat("scripts/districts/acceptance-expectations.mjs")
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
  for (const name of names)
    assert.match(sources, new RegExp(`\\b${name}\\b`), name);
});
