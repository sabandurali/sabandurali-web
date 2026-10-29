import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { homeEditorialContent } from "@/content/homeEditorialContent";

/*
 * ARCHITECTURE-8: the About page shows the same manifesto as the home page
 * and takes it from the one content module, so the two never drift apart.
 * The route file holds no copy of the lines.
 */
const page = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("ARCHITECTURE-8: the About page reads the manifesto from homeEditorialContent", () => {
  assert.match(
    page,
    /import \{ homeEditorialContent \} from "@\/content\/homeEditorialContent";/,
  );
  assert.match(page, /homeEditorialContent\.tr\.manifestoLines\.map\(/);
});

test("ARCHITECTURE-8: the route file keeps no copy of the manifesto lines", () => {
  assert.ok(homeEditorialContent.tr.manifestoLines.length > 0);
  for (const line of homeEditorialContent.tr.manifestoLines) {
    assert.equal(page.includes(line), false, `"${line}" is duplicated`);
  }
});
