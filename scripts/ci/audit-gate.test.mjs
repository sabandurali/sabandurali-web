import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  auditAllowlist,
  auditGate,
  ghsaId,
  listAdvisories,
} from "./audit-gate.mjs";

function advisory(name, severity, id, title = "advisory") {
  return {
    source: 1,
    name,
    severity,
    title,
    url: `https://github.com/advisories/${id}`,
  };
}

function report(...advisories) {
  const vulnerabilities = {};
  for (const via of advisories)
    vulnerabilities[via.name] = {
      severity: via.severity,
      via: [via],
    };
  // A parent package reaches the advisory through a name only.
  vulnerabilities.parent = { severity: "high", via: ["happy-dom"] };
  return { vulnerabilities };
}

test("TESTS-INFRA-2: a new high or critical advisory fails the gate", () => {
  const { problems } = auditGate(
    report(
      advisory("happy-dom", "high", "GHSA-c8p4-j97h-3vg8"),
      advisory("next", "high", "GHSA-aaaa-bbbb-cccc", "new next issue"),
      advisory("pg", "critical", "GHSA-dddd-eeee-ffff"),
      advisory("deepmerge", "low", "GHSA-gcqx-w48m-w2h4"),
      advisory("esbuild", "moderate", "GHSA-67mh-4wv8-2f99"),
    ),
  );
  assert.deepEqual(problems, [
    "high GHSA-aaaa-bbbb-cccc in next: new next issue",
    "critical GHSA-dddd-eeee-ffff in pg: advisory",
  ]);
});

test("the allowlist is by GHSA ID, not by package or severity", () => {
  // Another advisory in an allowlisted package still fails.
  const { problems } = auditGate(
    report(advisory("happy-dom", "high", "GHSA-zzzz-yyyy-xxxx")),
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /GHSA-zzzz-yyyy-xxxx/);
});

test("allowlisted advisories that npm stops reporting are flagged as stale", () => {
  const { problems, stale } = auditGate(report());
  assert.deepEqual(problems, []);
  assert.deepEqual(
    stale,
    auditAllowlist.map((entry) => entry.id),
  );
});

test("every allowlist entry is reviewed, dated and explained", () => {
  assert.ok(auditAllowlist.length <= 5, "the allowlist stays short");
  for (const entry of auditAllowlist) {
    assert.match(entry.id, /^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/);
    assert.match(entry.reviewed, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(entry.reason.length > 60, entry.id);
    assert.ok(entry.package, entry.id);
  }
});

test("a report without advisories data fails closed", () => {
  assert.throws(() => listAdvisories({ error: { code: "ENOTFOUND" } }));
  assert.equal(
    ghsaId("https://github.com/advisories/GHSA-x8rm-f576-gq67"),
    "GHSA-x8rm-f576-gq67",
  );
  assert.equal(ghsaId(undefined), null);
});

test("CI runs the gate instead of a severity-level audit", () => {
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
  const scripts = JSON.parse(readFileSync("package.json", "utf8")).scripts;
  assert.equal(scripts["ci:audit"], "node scripts/ci/audit-gate.mjs");
  assert.match(workflow, /run: npm run ci:audit/);
  assert.doesNotMatch(workflow, /--audit-level=critical/);
});
