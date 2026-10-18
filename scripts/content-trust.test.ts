import assert from "node:assert/strict";
import { test } from "node:test";
import { districts } from "../src/content/districts/district-registry";
import { districtMetadata } from "../src/content/districts/district-seo";
import { formatDistrictNumber, visibleDistrictSection, districtSectionNumber } from "../src/content/districts/district-presentation";
import { experience, education } from "../src/content/biography";
import { readFileSync } from "node:fs";

test("39 district metadata: unique, complete, canonical, OG, Twitter, no fictitious EN", () => {
  assert.equal(districts.length, 39);
  const titles = new Set();
  for (const district of districts) {
    const metadata = districtMetadata(district, null);
    titles.add(metadata.title);
    assert.ok(metadata.description?.includes(district.name));
    assert.ok(!metadata.description?.endsWith("…"));
    assert.equal(metadata.alternates?.canonical, `https://www.sabandurali.com/istanbul/ilceler/${district.slug}`);
    assert.deepEqual(Object.keys(metadata.alternates?.languages ?? {}), ["tr-TR"]);
    assert.ok(metadata.openGraph?.images);
    assert.ok(metadata.twitter && "card" in metadata.twitter);
    assert.equal(metadata.twitter.card, "summary_large_image");
  }
  assert.equal(titles.size, 39);
});
test("presentation preserves data, years and localized decimals", () => {
  assert.equal(formatDistrictNumber("458573"), "458.573");
  assert.equal(formatDistrictNumber(25.09), "25,09");
  assert.equal(formatDistrictNumber("458.573"), "458.573");
  assert.equal(formatDistrictNumber(null), null);
  const bundle = JSON.parse(readFileSync("data/districts/editorial.json", "utf8"));
  assert.equal(bundle.districts.length, 39);
  assert.equal(bundle.districts.find((d: {district: string}) => d.district === "kadikoy").facts.population, "458573");
});
test("all empty/published section combinations remain consecutive", () => {
  for (const research of [0, 1]) for (const news of [0, 1]) {
    const visible = Array.from({length: 14}, (_, i) => i).filter(i => visibleDistrictSection(i, research, news));
    assert.deepEqual(visible.map(i => districtSectionNumber(i, research, news)), visible.map((_, i) => String(i + 1).padStart(2, "0")));
    assert.ok(visible.includes(12) && visible.includes(13));
  }
});
test("user CV preserves eleven roles and ongoing education", () => {
  assert.equal(experience.length, 11);
  assert.match(education[0].description, /devam ediyor/);
});
