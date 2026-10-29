import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import nextConfig from "../../next.config";
import {
  getWorkspaceSectionPath,
  resolveWorkspaceSection,
} from "@/components/workspaces/workspace-routes";
import {
  getWorkspaceSectionRedirects,
  workspaceSectionRedirects,
} from "@/content/workspace-redirects";
import { workspaces } from "@/content/workspaces";

const here = path.dirname(fileURLToPath(import.meta.url));

test("the redirect list equals the workspace entries that live elsewhere", () => {
  const expected = workspaces.flatMap((workspace) =>
    workspace.entries
      .filter(
        (entry) =>
          entry.href !== getWorkspaceSectionPath(workspace.key, entry.slug),
      )
      .map((entry) => ({
        source: getWorkspaceSectionPath(workspace.key, entry.slug),
        destination: entry.href,
      })),
  );

  assert.deepEqual([...workspaceSectionRedirects], expected);
  for (const { source, destination } of workspaceSectionRedirects) {
    const [, key, slug] = source.split("/");
    assert.deepEqual(resolveWorkspaceSection(key ?? "", slug ?? ""), {
      kind: "redirect",
      href: destination,
    });
  }
});

test("next.config serves every workspace redirect permanently", async () => {
  assert.ok(nextConfig.redirects, "redirects() must be configured");
  const redirects = await nextConfig.redirects();

  for (const expected of getWorkspaceSectionRedirects()) {
    const matches = redirects.filter(
      (redirect) => redirect.source === expected.source,
    );
    assert.equal(matches.length, 1, expected.source);
    const [redirect] = matches;
    assert.equal(redirect?.destination, expected.destination);
    assert.ok(redirect !== undefined && "permanent" in redirect);
    assert.equal(redirect.permanent, true);
  }
});

test("the redirect module stays importable without the @/ alias", () => {
  // next.config.ts and the e2e scripts (Node type stripping) import it.
  const source = readFileSync(
    path.join(here, "workspace-redirects.ts"),
    "utf8",
  );
  assert.doesNotMatch(source, /^\s*import\s/m);
});

test("the e2e redirect check covers every workspace redirect", () => {
  const script = readFileSync(
    path.join(here, "../../scripts/content-trust-routes.mjs"),
    "utf8",
  );
  assert.match(script, /workspaceSectionRedirects/);
});
