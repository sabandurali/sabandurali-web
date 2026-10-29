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

function hrefFields(fields: Field[], prefix: string): Array<[string, Field]> {
  return fields.flatMap((field): Array<[string, Field]> => {
    const name = "name" in field ? `${prefix}.${field.name}` : prefix;
    if ("name" in field && field.name === "href") return [[name, field]];
    if ("fields" in field) return hrefFields(field.fields, name);
    if (field.type === "tabs") {
      return field.tabs.flatMap((tab) => hrefFields(tab.fields, name));
    }
    return [];
  });
}

test("ARCHITECTURE-10: every page block link uses the public link rule", () => {
  const links = pageBlocks.flatMap((block) =>
    hrefFields(block.fields, block.slug),
  );
  assert.ok(links.length >= 3, `${links.length} link fields`);

  for (const [name, field] of links) {
    assert.ok("validate" in field && typeof field.validate === "function");
    const validate = field.validate as (value: unknown) => true | string;
    assert.equal(validate("/makaleler/ornek"), true, name);
    assert.equal(validate("#bolum-2"), true, name);
    // The public page mapper drops credentials, so the admin refuses them.
    assert.equal(
      typeof validate("https://user:pass@example.com"),
      "string",
      name,
    );
    assert.equal(typeof validate("javascript:alert(1)"), "string", name);
  }
});
