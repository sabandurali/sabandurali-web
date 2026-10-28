import assert from "node:assert/strict";
import test from "node:test";
import {
  getWorkspaceEntry,
  getWorkspaceSectionParams,
  workspaces,
} from "./workspaces";

test("section params cover exactly the entries served by the [section] route", () => {
  for (const workspace of workspaces) {
    const params = getWorkspaceSectionParams(workspace.key);
    const slugs = params.map(({ section }) => section);

    assert.equal(new Set(slugs).size, slugs.length, workspace.key);
    for (const slug of slugs) {
      assert.equal(
        getWorkspaceEntry(workspace.key, slug)?.href,
        `/${workspace.key}/${slug}`,
      );
    }
    for (const entry of workspace.entries) {
      assert.equal(
        slugs.includes(entry.slug),
        entry.href === `/${workspace.key}/${entry.slug}`,
        `${workspace.key}/${entry.slug}`,
      );
    }
  }
});

test("entries that link elsewhere are not section pages", () => {
  const realEstate = getWorkspaceSectionParams("gayrimenkul-ve-istanbul").map(
    ({ section }) => section,
  );

  assert.equal(realEstate.includes("ilce-rehberi"), false);
  assert.ok(realEstate.includes("gayrimenkul-rehberleri"));
  assert.deepEqual(getWorkspaceSectionParams("unknown"), []);
});
