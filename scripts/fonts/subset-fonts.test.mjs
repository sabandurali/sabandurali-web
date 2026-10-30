import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  fonts,
  fontsDir,
  requiredCharacters,
  totalMaxBytes,
  unicodes,
} from "./subset-fonts.mjs";
import { readAxes, readCodePoints, readWoff2Tables } from "./woff2.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (file) => readFileSync(path.join(root, file), "utf8");
const [archivo, mono] = fonts;

function load(font) {
  const tables = readWoff2Tables(readFileSync(path.join(fontsDir, font.file)));
  return { codePoints: readCodePoints(tables), axes: readAxes(tables) };
}

test("PERF-FONTS: each font and both together stay within the byte budget", () => {
  let total = 0;
  for (const font of fonts) {
    const size = statSync(path.join(fontsDir, font.file)).size;
    assert.ok(
      size <= font.maxBytes,
      `${font.file}: ${size} B > ${font.maxBytes} B`,
    );
    total += size;
  }
  assert.ok(total <= totalMaxBytes, `fonts: ${total} B > ${totalMaxBytes} B`);
});

test("PERF-FONTS: every woff2 maps the Turkish letters, Latin and the digits", () => {
  const latin =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;!?·–—’“”…€₺";
  for (const font of fonts) {
    const { codePoints } = load(font);
    for (const character of requiredCharacters + latin) {
      const codePoint = character.codePointAt(0) ?? 0;
      // Martian Mono has no lira sign; the browser falls back for it.
      if (font === mono && character === "₺") continue;
      assert.ok(
        codePoints.has(codePoint),
        `${font.file} lacks ${character} (U+${codePoint.toString(16).toUpperCase().padStart(4, "0")})`,
      );
    }
    // The subset holds only the configured ranges.
    const ranges = unicodes.map((range) => {
      const [start, end = start] = range.slice(2).split("-");
      return [Number.parseInt(start, 16), Number.parseInt(end, 16)];
    });
    for (const codePoint of codePoints) {
      assert.ok(
        ranges.some(([start, end]) => codePoint >= start && codePoint <= end),
        `${font.file}: U+${codePoint.toString(16)} is outside the subset`,
      );
    }
  }
});

test("PERF-FONTS: the axes are limited to the configured ranges", () => {
  for (const font of fonts) {
    const { axes } = load(font);
    for (const [tag, range] of Object.entries(font.axes)) {
      if (Array.isArray(range)) {
        assert.deepEqual(
          [axes[tag]?.[0], axes[tag]?.[2]],
          range,
          `${font.file} ${tag}`,
        );
      } else {
        assert.equal(axes[tag], undefined, `${font.file}: ${tag} is pinned`);
      }
    }
  }
});

test("PERF-FONTS: every weight and width the styles ask for is in the files", () => {
  const css = read("src/app/globals.css");
  const weights = [...css.matchAll(/font-weight:\s*(\d+)/g)].map(([, value]) =>
    Number.parseInt(value ?? "", 10),
  );
  const tokens = Object.fromEntries(
    [...css.matchAll(/--stretch-([\w-]+):\s*([\d.]+)%/g)].map(
      ([, name, value]) => [name, Number.parseFloat(value ?? "")],
    ),
  );
  assert.ok(weights.length > 5 && Object.keys(tokens).length >= 8);
  // Tailwind weight utilities used by the components.
  const utilityWeights = {
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  };
  const [minWeight, maxWeight] = archivo.axes.wght;
  for (const weight of [...weights, ...Object.values(utilityWeights)]) {
    assert.ok(weight >= minWeight && weight <= maxWeight, `weight ${weight}`);
  }
  const [minWidth, maxWidth] = archivo.axes.wdth;
  for (const [name, width] of Object.entries(tokens)) {
    if (name === "mono") {
      assert.equal(width, mono.axes.wdth, "--stretch-mono is the pinned width");
      continue;
    }
    assert.ok(width >= minWidth && width <= maxWidth, `--stretch-${name}`);
  }
  for (const weight of [500, 600, 700]) {
    assert.ok(weight >= mono.axes.wght[0] && weight <= mono.axes.wght[1]);
  }
});

test("PERF-FONTS: fonts.ts declares the same ranges; the licences ship with the files", () => {
  const source = read("src/app/fonts.ts");
  assert.doesNotMatch(source, /next\/font\/google/);
  for (const font of fonts) {
    const call = source.slice(source.indexOf(`./_fonts/${font.file}`));
    const block = call.slice(0, call.indexOf("});"));
    assert.match(block, new RegExp(`weight: "${font.axes.wght.join(" ")}"`));
    const stretch = Array.isArray(font.axes.wdth)
      ? `${font.axes.wdth[0]}% ${font.axes.wdth[1]}%`
      : `${font.axes.wdth}%`;
    assert.match(block, new RegExp(`value: "${stretch}"`), font.file);
    const licence = path.join(fontsDir, font.licenseFile);
    assert.ok(existsSync(licence), font.licenseFile);
    assert.match(readFileSync(licence, "utf8"), /SIL OPEN FONT LICENSE/i);
  }
});
