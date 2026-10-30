import assert from "node:assert/strict";
import test from "node:test";
import { LEGACY_TURKISH_HOME_SLUG as collectionSlug } from "@/collections/Pages";
import {
  excludeLegacyTurkishHome,
  isLegacyTurkishHome,
  LEGACY_TURKISH_HOME_SLUG,
} from "./legacy-home";

test("the content layer and the Pages collection reserve the same slug", () => {
  assert.equal(LEGACY_TURKISH_HOME_SLUG, collectionSlug);
});

test("CORRECTNESS-2: only the Turkish ana-sayfa record is the legacy home", () => {
  assert.equal(
    isLegacyTurkishHome({ language: "tr", slug: "ana-sayfa" }),
    true,
  );
  assert.equal(
    isLegacyTurkishHome({ language: "en", slug: "ana-sayfa" }),
    false,
  );
  assert.equal(
    isLegacyTurkishHome({ language: "tr", slug: "projeler" }),
    false,
  );
  assert.deepEqual(
    excludeLegacyTurkishHome([
      { language: "tr", slug: "ana-sayfa" },
      { language: "tr", slug: "projeler" },
    ]),
    [{ language: "tr", slug: "projeler" }],
  );
});
