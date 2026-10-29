// Production dependency audit gate (CI job "audit"):
//
//   npm run ci:audit
//
// Runs `npm audit --omit=dev --json` and fails on every high or critical
// advisory that is not in the reviewed allowlist below, so a new high
// advisory in next, pg, sharp or any other production dependency fails CI
// instead of waiting for a Dependabot pull request. The allowlist names the
// GHSA ID, never a package or a severity level, and every entry says why
// the advisory does not reach this site and when to look again.
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

/** Severities that fail the gate unless their GHSA ID is allowlisted. */
export const blockingSeverities = Object.freeze(["high", "critical"]);

/**
 * Reviewed high advisories without a non-breaking fix. Each entry is
 * removed as soon as Payload ships the fixed dependency.
 */
export const auditAllowlist = Object.freeze([
  {
    id: "GHSA-c8p4-j97h-3vg8",
    package: "happy-dom",
    reason:
      "SSRF while parsing untrusted HTML. happy-dom is reached only through the `@lexical/headless/dom` entry, which neither Payload's richtext-lexical nor this repository imports; the fix (21.0.4) is a major upgrade below @lexical/headless's ^20.9.0 range.",
    reviewed: "2026-10-29",
  },
  {
    id: "GHSA-834v-8h66-3h79",
    package: "happy-dom",
    reason:
      "Unsanitised import alias in happy-dom's script evaluation; same unreachable `@lexical/headless/dom` path and the same major-only fix as GHSA-c8p4-j97h-3vg8.",
    reviewed: "2026-10-29",
  },
  {
    id: "GHSA-x8rm-f576-gq67",
    package: "graphql-scalars",
    reason:
      "ReDoS in the PhoneNumber scalar. @payloadcms/graphql pins graphql-scalars 1.22.2, but the site exposes no GraphQL route (REST only, CLAUDE.md), so no request reaches the scalar; the fix is the 2.x major.",
    reviewed: "2026-10-29",
  },
]);

/** GHSA ID of an advisory URL, or null. */
export function ghsaId(url) {
  return /\/(GHSA-[\w-]+)$/i.exec(url ?? "")?.[1] ?? null;
}

/**
 * Every advisory of an `npm audit --json` (v2) report, once per GHSA ID,
 * with the packages it reaches directly.
 */
export function listAdvisories(report) {
  if (!report || typeof report !== "object" || !report.vulnerabilities)
    throw new Error("npm audit returned no vulnerabilities object");
  const advisories = new Map();
  for (const vulnerability of Object.values(report.vulnerabilities))
    for (const via of vulnerability.via ?? []) {
      if (typeof via !== "object" || via === null) continue;
      const id = ghsaId(via.url) ?? `npm-${via.source}`;
      const entry = advisories.get(id) ?? {
        id,
        severity: via.severity,
        title: via.title,
        packages: new Set(),
      };
      entry.packages.add(via.name);
      advisories.set(id, entry);
    }
  return [...advisories.values()].map((entry) => ({
    ...entry,
    packages: [...entry.packages].sort(),
  }));
}

/**
 * Gate result: `problems` fail CI (a blocking advisory outside the
 * allowlist), `stale` lists allowlist entries npm no longer reports.
 */
export function auditGate(report, allowlist = auditAllowlist) {
  const advisories = listAdvisories(report);
  const allowed = new Set(allowlist.map((entry) => entry.id));
  const problems = advisories
    .filter(
      (advisory) =>
        blockingSeverities.includes(advisory.severity) &&
        !allowed.has(advisory.id),
    )
    .map(
      (advisory) =>
        `${advisory.severity} ${advisory.id} in ${advisory.packages.join(", ")}: ${advisory.title}`,
    );
  const reported = new Set(advisories.map((advisory) => advisory.id));
  const stale = allowlist
    .filter((entry) => !reported.has(entry.id))
    .map((entry) => entry.id);
  return { advisories, problems, stale };
}

function main() {
  const result = spawnSync("npm", ["audit", "--omit=dev", "--json"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  // npm audit exits non-zero whenever it reports anything; the JSON decides.
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    console.error(result.stderr);
    throw new Error("npm audit did not return JSON");
  }
  const { advisories, problems, stale } = auditGate(report);
  console.log(
    `npm audit: ${advisories.length} advisory(ies), ${problems.length} blocking`,
  );
  for (const id of stale)
    console.log(`note: allowlisted ${id} is no longer reported; remove it`);
  for (const problem of problems) console.error(`FAIL ${problem}`);
  if (problems.length > 0) process.exitCode = 1;
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
)
  main();
