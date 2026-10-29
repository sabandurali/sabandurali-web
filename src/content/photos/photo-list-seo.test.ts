import assert from "node:assert/strict";
import test from "node:test";
import { createPhotoListMetadata } from "./photo-list-seo";

const content = { tr: true, en: true };

test("SEO-PERF-3: later photo list pages name their page number", () => {
  const first = createPhotoListMetadata(
    "tr",
    {},
    { page: 1, totalItems: 40 },
    content,
  );
  const second = createPhotoListMetadata(
    "tr",
    {},
    { page: 2, totalItems: 40 },
    content,
  );
  const english = createPhotoListMetadata(
    "en",
    {},
    { page: 3, totalItems: 40 },
    content,
  );

  assert.equal(first.title, "Fotoğraflar | Şaban Durali");
  assert.equal(second.title, "Fotoğraflar — Sayfa 2 | Şaban Durali");
  assert.match(String(second.description), /Sayfa 2\.$/);
  assert.equal(english.title, "Photography — Page 3 | Şaban Durali");
  assert.match(String(english.description), /Page 3\.$/);
  // Titles and descriptions differ between indexable list pages.
  assert.notEqual(first.title, second.title);
  assert.notEqual(first.description, second.description);
  assert.match(String(second.alternates?.canonical), /\/fotograflar\?page=2$/);
});
