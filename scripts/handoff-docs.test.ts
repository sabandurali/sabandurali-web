import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// docs/PROJECT-STATE.md and docs/NEXT-STEPS.md are the binding handoff
// (CLAUDE.md). They must describe the code as it is: colours come from the
// İstanbul Atlası tokens, and the district section contract matches the
// render path.
const tokens = readFileSync("src/app/globals.css", "utf8").toLowerCase();
const handoff = ["docs/PROJECT-STATE.md", "docs/NEXT-STEPS.md"].map(
  (file) => [file, readFileSync(file, "utf8")] as const,
);

test("handoff docs quote only live token colours, or name old ones as retired", () => {
  for (const [file, text] of handoff)
    for (const line of text.split("\n"))
      for (const [hex] of line.matchAll(/#[0-9a-f]{6}\b/gi))
        assert.ok(
          tokens.includes(hex.toLowerCase()) || /\bretired\b/i.test(line),
          `${file}: ${hex} is neither a token in globals.css nor marked retired`,
        );
});

test("handoff docs point at the İstanbul Atlası design system", () => {
  for (const [file, text] of handoff) {
    assert.match(text, /İstanbul Atlası/, file);
    assert.doesNotMatch(
      text,
      /preserve the SD navy\/copper|navy\/copper\/ink brand system/i,
      file,
    );
  }
});

test("§H states that a failed research/news query keeps the section", () => {
  const [, projectState] = handoff[0];
  const contract = projectState.slice(
    projectState.indexOf("## H. District content contract"),
    projectState.indexOf("## I."),
  );
  assert.match(contract, /query failed/);
  assert.match(contract, /temporarily unavailable/);
  assert.match(contract, /getVisibleDistrictSections/);
});
