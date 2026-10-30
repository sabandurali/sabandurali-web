import assert from "node:assert/strict";
import test from "node:test";
import {
  categoryLabel,
  planningStatusLabel,
} from "@/components/districts/district-guide-model";
import {
  articleNewsCategoryOptions,
  photoDistrictCategoryOptions,
  planningStatusOptions,
} from "./option-labels";

test("admin option labels match what readers see on the site", () => {
  for (const option of [
    ...articleNewsCategoryOptions,
    ...photoDistrictCategoryOptions,
  ]) {
    assert.equal(option.label, categoryLabel(option.value), option.value);
  }
  for (const option of planningStatusOptions) {
    assert.equal(option.label, planningStatusLabel(option.value), option.value);
  }
});
