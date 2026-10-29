import assert from "node:assert/strict";
import test from "node:test";
import {
  isStatisticalRelease,
  sectionIsPublic,
  sourceSupportsSection,
  TRANSPORTATION_CHECK_MAX_AGE_DAYS,
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

const adnks: DistrictSource = {
  title: "Adrese Dayalı Nüfus Kayıt Sistemi Sonuçları, 2025",
  publisher: "Türkiye İstatistik Kurumu",
  url: "https://data.tuik.gov.tr/Bulten/Index?p=Adrese-Dayali-Nufus-Kayit-Sistemi-Sonuclari-2025-53899",
  sourceType: "official",
  primary: true,
  checkedAt: iso(now - day),
  dataDate: iso(now - 200 * day),
  needsVerification: false,
  sections: [
    "summary",
    "history",
    "geography",
    "life",
    "transportation",
    "facts",
    "neighborhoods",
    "housingTexture",
    "regionalAssessment",
    "placesGuide",
    "distinctiveFeatures",
    "researchTopics",
  ],
};

test("a population register release supports only population sections", () => {
  for (const section of [
    "summary",
    "facts",
    "neighborhoods",
    "regionalAssessment",
  ] as const)
    assert.equal(sourceSupportsSection(adnks, section, now), true, section);
  for (const section of [
    "history",
    "geography",
    "life",
    "transportation",
    "housingTexture",
    "placesGuide",
    "distinctiveFeatures",
    "researchTopics",
  ] as const) {
    assert.equal(sourceSupportsSection(adnks, section, now), false, section);
    // Nor can it open a narrative section on its own.
    assert.equal(sectionIsPublic(section, [section], [adnks], now), false);
  }
});

test("statistical releases are recognised by TÜİK host or ADNKS title", () => {
  assert.equal(isStatisticalRelease(adnks), true);
  assert.equal(
    isStatisticalRelease({
      title: "ADNKS Sonuçları, 2025",
      url: "https://example.org/tablo",
    }),
    true,
  );
  assert.equal(
    isStatisticalRelease({
      title: "Nüfus tablosu",
      url: "https://biruni.tuik.gov.tr/medas/",
    }),
    true,
  );
  assert.equal(
    isStatisticalRelease({
      title: "Tarihçe",
      url: "https://www.kadikoy.bel.tr/tarihce",
    }),
    false,
  );
  // A host that merely ends in the same letters is not TÜİK.
  assert.equal(
    isStatisticalRelease({
      title: "Rapor",
      url: "https://nottuik.gov.tr/rapor",
    }),
    false,
  );
});

test("CORRECTNESS-3: transportation needs a source checked within the window", () => {
  const transport: DistrictSource = {
    title: "Metro hattı açıldı",
    publisher: "Ulaştırma ve Altyapı Bakanlığı",
    url: "https://www.uab.gov.tr/haberler/metro",
    sourceType: "official",
    dataDate: iso(now - 4 * 365 * day),
    needsVerification: false,
    sections: ["transportation"],
  };
  const checked = (age: number) =>
    sourceSupportsSection(
      { ...transport, checkedAt: iso(now - age * day) },
      "transportation",
      now,
    );

  // An old opening announcement is fine while someone re-checked it.
  assert.equal(checked(0), true);
  assert.equal(checked(TRANSPORTATION_CHECK_MAX_AGE_DAYS), true);
  assert.equal(checked(TRANSPORTATION_CHECK_MAX_AGE_DAYS + 1), false);
  assert.equal(checked(4 * 365), false);
  assert.equal(
    sectionIsPublic(
      "transportation",
      ["transportation"],
      [{ ...transport, checkedAt: iso(now - 400 * day) }],
      now,
    ),
    false,
  );
});
