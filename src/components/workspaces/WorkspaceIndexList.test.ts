import assert from "node:assert/strict";
import test from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { workspaces } from "@/content/workspaces";
import WorkspaceIndexList from "./WorkspaceIndexList";

test("every workspace title link on /calisma-alanlari is a 44 px touch target", () => {
  const html = renderToStaticMarkup(h(WorkspaceIndexList));
  for (const workspace of workspaces) {
    const heading = new RegExp(
      `<h3 id="workspace-${workspace.key}"[^>]*>(<a [^>]*>)`,
    ).exec(html);
    assert.ok(heading, workspace.key);
    const link = heading[1] ?? "";
    assert.match(link, new RegExp(`href="/${workspace.key}"`));
    // DESIGN-SYSTEM §6: a standalone link is at least 44 × 44 px.
    assert.match(link, /class="[^"]*\bmin-h-tap\b/, workspace.key);
    assert.match(link, /class="[^"]*\binline-flex\b/, workspace.key);
  }
});
