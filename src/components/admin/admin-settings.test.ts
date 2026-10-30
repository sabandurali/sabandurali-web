import assert from "node:assert/strict";
import test from "node:test";
import { ADMIN_I18N, ADMIN_META, ADMIN_TITLE_SUFFIX } from "./admin-settings";

test("ADM-I18N: the admin speaks Turkish, with English selectable", () => {
  assert.equal(ADMIN_I18N.fallbackLanguage, "tr");
  assert.deepEqual(Object.keys(ADMIN_I18N.supportedLanguages).toSorted(), [
    "en",
    "tr",
  ]);
  const turkish = ADMIN_I18N.supportedLanguages.tr.translations;
  // The buttons the admin guide names.
  assert.equal(turkish.version.publishChanges, "Değişiklikleri yayınla");
  assert.equal(turkish.version.saveDraft, "Taslağı kaydet");
  assert.equal(turkish.version.unpublish, "Yayından Kaldır");
});

test("ADM-QUICK-UX: admin pages are never indexed and carry the site suffix", () => {
  assert.deepEqual(ADMIN_META.robots, { follow: false, index: false });
  assert.equal(ADMIN_META.titleSuffix, ADMIN_TITLE_SUFFIX);
  assert.match(ADMIN_TITLE_SUFFIX, /Yönetim/);
  // No unauthenticated Open Graph image renderer at /api/og.
  assert.equal(ADMIN_META.defaultOGImageType, "off");
});
