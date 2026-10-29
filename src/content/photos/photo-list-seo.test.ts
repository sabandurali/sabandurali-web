import assert from "node:assert/strict";
import test from "node:test";
import {
  createPhotoListMetadata,
  loadPhotoListMetadata,
} from "./photo-list-seo";

const content = { tr: true, en: true };

test("SEO-PERF-4: only the unfiltered first page checks the other language", async () => {
  const run = async (
    filters: Parameters<typeof loadPhotoListMetadata>[1],
    served: { page: number; totalItems: number },
  ) => {
    const checked: string[] = [];
    const metadata = await loadPhotoListMetadata("tr", filters, {
      list: async () => served,
      hasPhotos: async (locale) => {
        checked.push(locale);
        return true;
      },
    });
    return { checked, metadata };
  };

  // The list itself: one check, of the other language only.
  const first = await run({}, { page: 1, totalItems: 30 });
  assert.deepEqual(first.checked, ["en"]);
  assert.ok(first.metadata.alternates?.languages);

  // Later and filtered pages run no extra query.
  const later = await run({ page: 2 }, { page: 2, totalItems: 30 });
  assert.deepEqual(later.checked, []);
  const tagged = await run({ tag: "kule" }, { page: 1, totalItems: 3 });
  assert.deepEqual(tagged.checked, []);

  // A page past the end served as page 1 is the list: checked afterwards.
  const clamped = await run({ page: 9 }, { page: 1, totalItems: 5 });
  assert.deepEqual(clamped.checked, ["en"]);
});

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
