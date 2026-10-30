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
  // Private backup and security notes live here, never in docs/.
  ".private-backups/docs/SECURITY-REVIEW-2026-10-21.md",
  ".private-backups/docs/BACKUP-RESTORE-2026-10-21.md",
  // A dated private note saved into docs/ by mistake stays out of Git.
  "docs/BACKUP-RESTORE-2026-10-21.md",
  "docs/BACKUP-COMPLETION-2026-10-21.md",
  "docs/LIVE-BACKUP-2026-10-21.md",
  "docs/SECURITY-REVIEW-2026-10-21.md",
  "ml-env/bin/python",
  "public/media/upload.jpg",
  "reports/production-release-20261018/README.md",
  "reports/production-release-20261018/rollback.md",
  "reports/istanbul-39/route-log.txt",
  "reports/istanbul-39/screenshots/esenler.png",
  // ARC-12: the reviewed neighbourhood lists moved to data/districts/.
  "reports/istanbul-39/editorial-review.json",
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
  "data/districts/editorial-review.json",
  // The tracked docs next to the ignored dated notes above.
  "docs/SECURITY.md",
  "docs/PROJECT-STATE.md",
  "docs/DESIGN-SYSTEM.md",
  "docs/LOCAL-DEVELOPMENT.md",
  "docs/NEXT-STEPS.md",
  "docs/releases/2026-10-30-quality-atlas.md",
  "docs/releases/2026-11-15-example-release.md",
];

test("secrets, local data and private evidence are ignored by Git", () => {
  const exposed = mustBeIgnored.filter((file) => !isIgnored(file));
  assert.deepEqual(exposed, [], `not ignored: ${exposed.join(", ")}`);
});

test("no backup, restore or security-review note is tracked", () => {
  // These notes name backup locations, encrypted copies and open security
  // findings, and the repository is public. They belong in .private-backups/
  // (docs/NEXT-STEPS.md §7); a `git add -A` that picks one up fails here.
  const result = spawnSync("git", ["ls-files", "-z"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const leaked = result.stdout
    .split("\0")
    .filter((file) =>
      /(^|\/)[^/]*(BACKUP|RESTORE|SECURITY-REVIEW)[^/]*\.(md|txt|pdf)$/i.test(
        file,
      ),
    );
  assert.deepEqual(leaked, []);
});

test("templates, placeholders and reviewed summaries stay trackable", () => {
  const hidden = mustBeTracked.filter((file) => isIgnored(file));
  assert.deepEqual(hidden, [], `ignored by mistake: ${hidden.join(", ")}`);
});

test("the dated-note rules hide no tracked document in docs/", () => {
  const result = spawnSync("git", ["ls-files", "-z", "--", "docs"], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  const tracked = result.stdout.split("\0").filter(Boolean);
  assert.ok(tracked.length > 0);
  const hidden = tracked.filter((file) => isIgnored(file));
  assert.deepEqual(hidden, [], `ignored by mistake: ${hidden.join(", ")}`);
});
