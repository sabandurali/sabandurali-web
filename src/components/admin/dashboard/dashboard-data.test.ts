import assert from "node:assert/strict";
import test from "node:test";
import {
  contentReferenceTime,
  isEditorialBundle,
  isResearchBundle,
  readCheckedJson,
} from "../../../../scripts/districts/content-acceptance";
import { attachEditorial } from "../../../../scripts/districts/editorial";
import { districtFreshness } from "../../../../scripts/districts/freshness";
import { makeDraft } from "../../../../scripts/districts/import-core";
import {
  findExpiringDistrictData,
  findMediaGaps,
  findMissingEnglish,
} from "./dashboard-data";

test("ADM-DASHBOARD: published records without their English fields are listed", () => {
  const docs = [
    {
      excerpt: { en: "Summary", tr: "Özet" },
      id: "complete",
      slug: { en: "complete", tr: "tam" },
      title: { en: "Complete", tr: "Tam" },
    },
    {
      excerpt: { tr: "Özet" },
      id: "no-en-excerpt",
      slug: { en: "partial", tr: "eksik" },
      title: { en: "Partial", tr: "Eksik" },
    },
    {
      articleType: "district-news",
      id: "news",
      slug: { tr: "haber" },
      title: { tr: "Haber" },
    },
  ];
  assert.deepEqual(findMissingEnglish("articles", docs), [
    { id: "no-en-excerpt", title: "Eksik" },
  ]);
  assert.deepEqual(
    findMissingEnglish("photos", [
      {
        altText: { tr: "Kıyı" },
        id: 7,
        slug: { en: "coast", tr: "kiyi" },
        title: { en: "Coast", tr: "Kıyı" },
      },
    ]),
    [{ id: "7", title: "Kıyı" }],
  );
});

test("ADM-DASHBOARD: media without alt text or credit are listed with what is missing", () => {
  assert.deepEqual(
    findMediaGaps([
      { alt: "Kule", filename: "kule.jpg", id: "a", sourceCopyright: "CC BY" },
      { alt: "Kıyı", filename: "kiyi.jpg", id: "b", sourceCopyright: " " },
      { alt: "", filename: "bos.jpg", id: "c" },
    ]),
    [
      { id: "b", missingAlt: false, missingCredit: true, title: "kiyi.jpg" },
      { id: "c", missingAlt: true, missingCredit: true, title: "bos.jpg" },
    ],
  );
});

test("ADM-DASHBOARD: expiring district data matches the CLI freshness report", () => {
  const research = readCheckedJson(
    "data/districts/research.json",
    isResearchBundle,
  );
  const editorial = readCheckedJson(
    "data/districts/editorial.json",
    isEditorialBundle,
  );
  const referenceTime = contentReferenceTime(editorial);
  attachEditorial(research, editorial, referenceTime);
  const records = research.districts;
  const guides = records.map((record) => ({
    ...makeDraft(record),
    id: `guide-${record.district}`,
  }));

  // Nothing runs out at the review time itself.
  assert.deepEqual(findExpiringDistrictData(guides, referenceTime, 0), []);

  const window = 3650;
  const expected = districtFreshness(
    records,
    referenceTime,
    referenceTime,
    window,
  );
  assert.ok(expected.length > 0);
  const found = findExpiringDistrictData(guides, referenceTime, window);
  assert.deepEqual(
    found.flatMap((item) =>
      item.fields.map((field) => `${item.id.replace("guide-", "")}/${field}`),
    ),
    expected.map(({ district, field }) => `${district}/${field}`),
  );
  assert.ok(found.every((item) => item.title.length > 0));
});
