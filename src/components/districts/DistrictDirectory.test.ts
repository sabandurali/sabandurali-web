import assert from "node:assert/strict";
import test from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { districts } from "@/content/districts/district-registry";
import DistrictDirectory from "./DistrictDirectory";

const entries = districts.map(({ name, slug, side }, index) => ({
  name,
  slug,
  side,
  ref: `A${index + 1}`,
  summary: null,
}));

test("COMPLETENESS-1: filters stay disabled until hydration; every card is listed", () => {
  // renderToStaticMarkup is the server HTML a visitor without JavaScript
  // (or before hydration) receives.
  const html = renderToStaticMarkup(h(DistrictDirectory, { entries }));

  assert.match(html, /<input [^>]*type="search"[^>]*disabled=""/);
  assert.match(html, /<select [^>]*disabled=""/);
  const letterButtons = [...html.matchAll(/<button [^>]*>/g)].map(
    ([tag]) => tag,
  );
  assert.ok(letterButtons.length > 10);
  for (const tag of letterButtons) assert.match(tag, /disabled=""/);

  assert.match(
    html,
    /<noscript>.*Arama ve filtreler JavaScript gerektirir; 39 ilçenin tümü/,
  );
  assert.equal([...html.matchAll(/data-district-card=/g)].length, 39);
});
