/**
 * The admin editor offers only what the public renderer (PayloadRichText)
 * has a design for. Loading the Payload config needs its environment; the
 * values below never reach a database (nothing connects here).
 */
import assert from "node:assert/strict";
import test from "node:test";
import { defaultEditorFeatures } from "@payloadcms/richtext-lexical";

Object.assign(process.env, {
  DATABASE_URL: process.env.DATABASE_URL || "file:./.data/unit-test.db",
  PAYLOAD_DATABASE: process.env.PAYLOAD_DATABASE || "sqlite",
  PAYLOAD_SECRET: process.env.PAYLOAD_SECRET || "unit-test-only-secret",
  PAYLOAD_STORAGE: process.env.PAYLOAD_STORAGE || "local",
});

const { configureRichTextFeatures, RICH_TEXT_REMOVED_FEATURES } =
  await import("../../payload.config");

const keys = configureRichTextFeatures(defaultEditorFeatures).map(
  (feature) => feature.key,
);

test("features without a public design are not offered to editors", () => {
  for (const key of [
    "checklist",
    "underline",
    "strikethrough",
    "align",
    "indent",
    "relationship",
  ]) {
    assert.equal(keys.includes(key), false, `${key} is still enabled`);
  }
  assert.deepEqual([...RICH_TEXT_REMOVED_FEATURES].sort(), [
    "align",
    "checklist",
    "indent",
    "relationship",
    "strikethrough",
    "underline",
  ]);
});

test("the features the renderer designs stay enabled", () => {
  for (const key of [
    "bold",
    "italic",
    "inlineCode",
    "subscript",
    "superscript",
    "paragraph",
    "heading",
    "unorderedList",
    "orderedList",
    "link",
    "blockquote",
    "upload",
    "horizontalRule",
  ]) {
    assert.ok(keys.includes(key), `${key} is missing`);
  }
});
