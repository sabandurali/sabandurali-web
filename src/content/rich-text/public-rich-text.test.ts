import assert from "node:assert/strict";
import test from "node:test";
import { hasMeaningfulRichText as cmsPublishRule } from "@/collections/validation";
import {
  hasMeaningfulRichText,
  isMeaningfulPublicRichText,
  isPublicRichText,
} from "./public-rich-text";

const root = (children: unknown[]) => ({
  root: { type: "root", children, direction: null, format: "", indent: 0 },
});
const paragraph = (...children: unknown[]) => ({
  type: "paragraph",
  children,
});
const text = (value: string) => ({ type: "text", text: value });

const cases: Array<[string, unknown, boolean, boolean]> = [
  // name, value, renderable shape, meaningful
  ["null", null, false, false],
  ["string", "metin", false, false],
  ["no root", {}, false, false],
  ["root without children", { root: { type: "root" } }, false, false],
  ["empty root", root([]), true, false],
  ["blank paragraph", root([paragraph(text("   "))]), true, false],
  ["empty paragraph", root([paragraph()]), true, false],
  ["text", root([paragraph(text("Metin"))]), true, true],
  [
    "nested text",
    root([{ type: "list", children: [paragraph(text("Madde"))] }]),
    true,
    true,
  ],
  ["upload only", root([{ type: "upload", value: "m1" }]), true, true],
];

test("ARCHITECTURE-5: one shape guard for article and page rich text", () => {
  for (const [name, value, shape] of cases)
    assert.equal(isPublicRichText(value), shape, name);
});

test("ARCHITECTURE-3: visible content needs non-blank text or an upload", () => {
  for (const [name, value, , meaningful] of cases) {
    assert.equal(hasMeaningfulRichText(value), meaningful, name);
    assert.equal(isMeaningfulPublicRichText(value), meaningful, name);
  }
});

test("ARCHITECTURE-5: public content types never import Payload document types", async () => {
  const { readFile } = await import("node:fs/promises");
  for (const file of [
    "../articles/public-types.ts",
    "../pages/public-types.ts",
    "../books/public-types.ts",
  ]) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /@\/payload-types/, file);
  }
});

test("ARCHITECTURE-3: the CMS publish rule is the public rule", () => {
  assert.equal(cmsPublishRule, hasMeaningfulRichText);
});
