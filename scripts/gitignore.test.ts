import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

// Secrets, local databases, private backups and release evidence must never be
// staged. Nested .gitignore files can re-include paths that the root file
// excludes (reports/.gitignore does this with !*/), so the rules are checked
// as Git resolves them, not by reading one file.
function isIgnored(file: string): boolean {
  const result = spawnSync(
    "git",
    ["check-ignore", "--no-index", "--quiet", file],
    {
      encoding: "utf8",
    },
  );
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(`git check-ignore failed for ${file}: ${result.stderr}`);
  }
  return result.status === 0;
}

const mustBeIgnored = [
  ".env",
  ".env.local",
  ".env.production.local",
  ".env.vercel",
  ".data/payload.db",
  ".data/ci.db",
  ".private-backups/2026-10-21/payload.dump",
  "ml-env/bin/python",
  "public/media/upload.jpg",
  "reports/production-release-20261018/README.md",
  "reports/production-release-20261018/rollback.md",
  "reports/istanbul-39/route-log.txt",
  "reports/istanbul-39/screenshots/esenler.png",
  "server.pem",
  "signing.key",
  "export.sql",
  "backup.dump",
  "local.sqlite",
  "local.db",
  ".claude/worktrees/wf_example/README.md",
  ".claude/settings.local.json",
];

const mustBeTracked = [
  ".env.example",
  ".data/.gitkeep",
  "public/media/.gitkeep",
  "reports/.gitignore",
  "reports/README.md",
  "reports/istanbul-39/README.md",
  "data/districts/editorial.json",
];

test("secrets, local data and private evidence are ignored by Git", () => {
  const exposed = mustBeIgnored.filter((file) => !isIgnored(file));
  assert.deepEqual(exposed, [], `not ignored: ${exposed.join(", ")}`);
});

test("templates, placeholders and reviewed summaries stay trackable", () => {
  const hidden = mustBeTracked.filter((file) => isIgnored(file));
  assert.deepEqual(hidden, [], `ignored by mistake: ${hidden.join(", ")}`);
});
