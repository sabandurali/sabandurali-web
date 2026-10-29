import assert from "node:assert/strict";
import test from "node:test";
import {
  getWorkspaceEntry,
  getWorkspaceSectionParams,
  workspaces,
} from "./workspaces";
import { homeContent } from "./homeContent";

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

test("FRONTEND-4: home focus cards name the workspaces as the site does", () => {
  // Turkish cards use the workspace title of the page they open; English
  // cards use the English navigation names. Neither is written in capitals:
  // only type-region labels are, and those through CSS.
  for (const card of homeContent.tr.focusAreas.cards) {
    const workspace = workspaces.find(({ key }) => card.linkHref === `/${key}`);
    assert.ok(workspace, card.title);
    assert.equal(card.title, workspace.title);
  }
  assert.deepEqual(
    homeContent.en.focusAreas.cards.map(({ title }) => title),
    [
      "Real Estate & Istanbul",
      "Sales & Negotiation",
      "Research & Analysis",
      "AI & Technology",
      "Books & Learning",
      "Photography",
    ],
  );
  for (const locale of ["tr", "en"] as const) {
    for (const { title } of homeContent[locale].focusAreas.cards) {
      assert.notEqual(title, title.toLocaleUpperCase(locale), title);
    }
  }
});
