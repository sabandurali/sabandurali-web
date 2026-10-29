import assert from "node:assert/strict";
import test from "node:test";
import {
  checkDistrictRecord,
  isEditorialBundle,
  isHistoricalPhotoBundle,
  isNeighbourhoodEvidence,
  isResearchBundle,
  readCheckedJson,
  requireDistrictRow,
} from "./content-acceptance";
import { attachEditorial } from "./editorial";

function loadAttached() {
  const research = readCheckedJson(
    "data/districts/research.json",
    isResearchBundle,
  );
  const editorial = readCheckedJson(
    "data/districts/editorial.json",
    isEditorialBundle,
  );
  const evidence = readCheckedJson(
    "data/districts/editorial-review.json",
    isNeighbourhoodEvidence,
  );
  attachEditorial(research, editorial);
  const record = research.districts[0];
  assert.ok(record);
  return { record, evidence };
}

test("the repository data passes the input guards", () => {
  assert.ok(
    readCheckedJson(
      "data/districts/historical-photo-candidates.json",
      isHistoricalPhotoBundle,
    ).districts.length > 0,
  );
});

test("a wrongly shaped JSON input is rejected by its guard", () => {
  assert.equal(isResearchBundle({ districts: "39" }), false);
  assert.equal(isEditorialBundle({ schemaVersion: 2, districts: [] }), false);
  assert.equal(
    isEditorialBundle({
      schemaVersion: 1,
      districts: [{ district: "esenler", sections: { summary: 1 } }],
    }),
    false,
  );
  assert.equal(isNeighbourhoodEvidence([{ district: "esenler" }]), false);
  assert.equal(
    isHistoricalPhotoBundle({
      schemaVersion: 1,
      districts: [
        {
          district: "esenler",
          notes: "",
          candidates: [{ currentDistrictMatch: "maybe" }],
        },
      ],
    }),
    false,
  );
});

test("a missing editorial-review record fails with the district name", () => {
  const { record, evidence } = loadAttached();
  const without = evidence.filter((row) => row.district !== record.district);

  assert.throws(
    () => checkDistrictRecord(record, without, undefined),
    (error: unknown) =>
      error instanceof assert.AssertionError &&
      error.message === `${record.district}: editorial-review record missing`,
  );
});

test("a record without an attached review fails with the district name", () => {
  const { record, evidence } = loadAttached();

  assert.throws(
    () =>
      checkDistrictRecord(
        { ...record, editorial: undefined },
        evidence,
        undefined,
      ),
    (error: unknown) =>
      error instanceof assert.AssertionError &&
      error.message === `${record.district}: editorial review not attached`,
  );
});

test("requireDistrictRow names the district and the list", () => {
  assert.throws(
    () => requireDistrictRow([{ district: "esenler" }], "sisli", "editorial"),
    /^AssertionError.*sisli: editorial record missing/,
  );
  assert.deepEqual(
    requireDistrictRow([{ district: "esenler" }], "esenler", "editorial"),
    { district: "esenler" },
  );
});
