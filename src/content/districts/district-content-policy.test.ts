import assert from "node:assert/strict";
import test from "node:test";
import {
  sectionIsPublic,
  sourceSupportsSection,
  type DistrictSource,
} from "./district-content-policy";
import { sanitizeDistrictSources } from "./district-guide-projection";

const now = Date.parse("2026-09-13T12:00:00Z");
const day = 24 * 60 * 60 * 1000;
const iso = (time: number) => new Date(time).toISOString();

const market: DistrictSource = {
  title: "Piyasa raporu",
  publisher: "Örnek Endeks",
  url: "https://example.org/rapor",
  sourceType: "market",
  checkedAt: iso(now - day),
  dataDate: iso(now - 10 * day),
  needsVerification: false,
  sections: ["marketData", "summary"],
};

test("market data needs a checked and dated source from the last 90 days", () => {
  assert.equal(sourceSupportsSection(market, "marketData", now), true);

  for (const change of [
    { dataDate: iso(now - 91 * day) },
    { checkedAt: iso(now - 91 * day) },
    { dataDate: null },
    { dataDate: "not a date" },
    { checkedAt: undefined },
    { dataDate: iso(now + day) },
  ]) {
    assert.equal(
      sourceSupportsSection({ ...market, ...change }, "marketData", now),
      false,
      JSON.stringify(change),
    );
  }
});

test("narrative sections need a checked date but no data date", () => {
  assert.equal(
    sourceSupportsSection({ ...market, dataDate: null }, "summary", now),
    true,
  );
  assert.equal(
    sourceSupportsSection({ ...market, checkedAt: null }, "summary", now),
    false,
  );
});

test("raw CMS sources are type-checked before the policy reads them", () => {
  const sources = sanitizeDistrictSources([
    { ...market, checkedAt: 42, sections: ["marketData", "unknown"] },
    "not a row",
    null,
  ]);

  assert.equal(sources.length, 1);
  assert.equal(sources[0]?.checkedAt, undefined);
  assert.deepEqual(sources[0]?.sections, ["marketData"]);
  assert.equal(
    sectionIsPublic("marketData", ["marketData"], sources, now),
    false,
  );
  assert.deepEqual(sanitizeDistrictSources(undefined), []);
  assert.deepEqual(sanitizeDistrictSources({ title: "x" }), []);
});
