import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getWorkspace } from "@/content/workspaces";
import { homeContent } from "@/content/homeContent";
import { getStaticHeaderNavigationItems } from "@/content/navigation/static-navigation";
import { districtWorkspaceCrumb } from "./district-breadcrumb";

test("the district parent crumb carries the workspace's own name", () => {
  const workspace = getWorkspace("gayrimenkul-ve-istanbul");
  assert.ok(workspace);
  assert.deepEqual(districtWorkspaceCrumb, {
    label: workspace.title,
    href: "/gayrimenkul-ve-istanbul",
  });
  assert.notEqual(districtWorkspaceCrumb.label, "İstanbul");
});

test("the header names the crumb's target the same way", () => {
  const home = homeContent.tr;
  const item = getStaticHeaderNavigationItems({
    locale: "tr",
    anchors: home.anchors,
    content: home.header,
    anchorPrefix: "/",
  }).find((link) => link.href === districtWorkspaceCrumb.href);
  assert.ok(item);
  assert.equal(item.label, districtWorkspaceCrumb.label);
});

test("district pages use the shared crumb instead of a local label", async () => {
  for (const file of [
    new URL("./DistrictGuideArticle.tsx", import.meta.url),
    new URL("./DistrictNewsListPage.tsx", import.meta.url),
    new URL("../../app/(tr)/istanbul/ilceler/page.tsx", import.meta.url),
  ]) {
    const source = await readFile(file, "utf8");
    assert.match(source, /districtWorkspaceCrumb/, file.pathname);
    assert.doesNotMatch(
      source,
      /label:\s*"[^"]*",\s*href:\s*"\/gayrimenkul-ve-istanbul"/,
      file.pathname,
    );
  }
});
