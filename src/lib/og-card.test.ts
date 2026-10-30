import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { brandLogo, brandLogoOnDark } from "@/config/brand";
import { districts } from "@/content/districts/district-registry";
import {
  getDistrictDirectoryShareCard,
  getDistrictShareCard,
} from "@/content/districts/district-seo";
import { readFontCodePoints } from "./font-cmap";
import {
  OgCard,
  createOgCard,
  defaultOgCardBrand,
  getOgBrandImageSource,
  getOgTitleSize,
  ogCardSize,
} from "./og-card";

const require = createRequire(import.meta.url);

/** The font `next/og` bundles and uses when a card names no other. */
function bundledCardFont(): Uint8Array {
  const entry = require.resolve("next/dist/compiled/@vercel/og/index.node.js");
  return readFileSync(path.join(path.dirname(entry), "Geist-Regular.ttf"));
}

test("DISTRICT-OG: the card font draws every Turkish letter", () => {
  const codePoints = readFontCodePoints(bundledCardFont());
  const missing = [..."ıİşŞğĞçÇöÖüÜâÂîÎûÛ·"].filter(
    (letter) => !codePoints.has(letter.codePointAt(0) ?? 0),
  );
  assert.deepEqual(missing, []);
  // The reader is not a yes-machine: a CJK ideograph is not in the font.
  assert.equal(codePoints.has("漢".codePointAt(0) ?? 0), false);
});

test("DISTRICT-OG: every district card text is in the card font", () => {
  const codePoints = readFontCodePoints(bundledCardFont());
  const cards = [
    getDistrictDirectoryShareCard(),
    ...districts.map(getDistrictShareCard),
  ];
  for (const card of cards) {
    const text = `${card.eyebrow}${card.title}${card.subtitle}${defaultOgCardBrand.domain}`;
    for (const letter of text.replace(/\s/g, "")) {
      assert.ok(
        codePoints.has(letter.codePointAt(0) ?? 0),
        `${card.title}: "${letter}" is not in the card font`,
      );
    }
  }
});

test("DISTRICT-OG: long names get a smaller title size", () => {
  assert.equal(getOgTitleSize("Şile"), 128);
  assert.ok(getOgTitleSize("Büyükçekmece") < getOgTitleSize("Şile"));
  for (const district of districts) {
    assert.ok(getOgTitleSize(district.name) >= 84, district.name);
  }
});

test("DISTRICT-OG: the card renders a 1200×630 PNG", async () => {
  const kadikoy = districts.find((district) => district.slug === "kadikoy");
  assert.ok(kadikoy);
  const response = createOgCard(getDistrictShareCard(kadikoy));
  assert.equal(response.headers.get("content-type"), "image/png");
  const png = new Uint8Array(await response.arrayBuffer());
  // PNG signature, then the IHDR width and height.
  assert.deepEqual(
    [...png.slice(0, 8)],
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  );
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  assert.equal(view.getUint32(16), ogCardSize.width);
  assert.equal(view.getUint32(20), ogCardSize.height);
});

function dataUriBytes(source: string, type: string): Buffer {
  const prefix = `data:${type};base64,`;
  assert.ok(source.startsWith(prefix), source.slice(0, 40));
  return Buffer.from(source.slice(prefix.length), "base64");
}

test("BRAND-OG: the card shows the identity v1 logo file for the sea ground, not live text", () => {
  assert.equal(defaultOgCardBrand.logo, brandLogoOnDark);
  assert.equal(
    defaultOgCardBrand.logo.src,
    "/brand/saban-durali-logo-color-ondark.svg",
  );
  // The embedded image is the package file, byte for byte.
  const embedded = dataUriBytes(
    getOgBrandImageSource(defaultOgCardBrand.logo),
    "image/svg+xml",
  );
  assert.deepEqual(
    embedded,
    readFileSync(
      "brand/saban-durali-kimlik-v1/logo/saban-durali-logo-color-ondark.svg",
    ),
  );

  const first = districts[0];
  assert.ok(first);
  const markup = JSON.stringify(OgCard(getDistrictShareCard(first)));
  assert.ok(markup.includes(getOgBrandImageSource(brandLogoOnDark)));
  // The name is never set in the card font next to the logo.
  assert.doesNotMatch(markup, /Şaban Durali/);
  assert.match(markup, /sabandurali\.com/);
});

test("BRAND-OG: only files of public/brand/ can be embedded", () => {
  for (const src of [
    "/icon.png",
    "/brand/../../.env.local",
    "/brand/logo.jpg",
    "brand/saban-durali-logo-color.svg",
  ]) {
    assert.throws(
      () => getOgBrandImageSource({ src, width: 1, height: 1 }),
      /Not a brand file/,
      src,
    );
  }
});

test("DISTRICT-OG: the brand mark is one swappable input", () => {
  const first = districts[0];
  assert.ok(first);
  const card = getDistrictShareCard(first);
  const branded = JSON.stringify(
    OgCard({ ...card, brand: { logo: brandLogo, domain: "ornek.test" } }),
  );
  assert.ok(branded.includes(getOgBrandImageSource(brandLogo)));
  assert.match(branded, /ornek\.test/);
  assert.ok(!branded.includes(getOgBrandImageSource(brandLogoOnDark)));
  assert.doesNotMatch(branded, /sabandurali\.com/);
});
