import assert from "node:assert/strict";
import test from "node:test";
import type { Field } from "payload";
import { imageMediaFilter } from "../collections/validation";
import { pageBlocks } from "./pageBlocks";

function uploadFields(fields: Field[], prefix: string): Array<[string, Field]> {
  return fields.flatMap((field): Array<[string, Field]> => {
    const name = "name" in field ? `${prefix}.${field.name}` : prefix;
    if (field.type === "upload") return [[name, field]];
    if ("fields" in field) return uploadFields(field.fields, name);
    if (field.type === "tabs") {
      return field.tabs.flatMap((tab) => uploadFields(tab.fields, name));
    }
    return [];
  });
}

test("every page block image only accepts image media", () => {
  const uploads = pageBlocks.flatMap((block) =>
    uploadFields(block.fields, block.slug),
  );

  assert.deepEqual(uploads.map(([name]) => name).sort(), [
    "cardGroup.cards.image",
    "homeAbout.image",
    "imageText.image",
  ]);
  for (const [name, field] of uploads) {
    assert.ok(field.type === "upload", name);
    assert.equal(field.filterOptions, imageMediaFilter, name);
  }
});
