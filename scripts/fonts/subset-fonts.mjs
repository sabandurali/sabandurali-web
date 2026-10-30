#!/usr/bin/env node
/*
 * Builds the self-hosted fonts in src/app/_fonts/ (PERF-FONTS).
 *
 *   FONTTOOLS_PYTHON=/path/to/python node scripts/fonts/subset-fonts.mjs
 *
 * Developer tool, not part of the build or CI: the generated woff2 files are
 * committed and scripts/fonts/subset-fonts.test.mjs checks them. It needs a
 * Python with fontTools and brotli (`pip install fonttools brotli`) and
 * network access to raw.githubusercontent.com.
 *
 * 1. Downloads the variable sources from google/fonts at a pinned commit and
 *    refuses any file whose SHA-256 differs.
 * 2. Limits the axes to what the design system uses (fontTools instancer):
 *    Archivo wght 400–800 and wdth 76–125 %; Martian Mono wght 500–700 with
 *    the width pinned at --stretch-mono (87.5 %).
 * 3. Subsets both to one Latin + Turkish character set and writes woff2.
 *
 * Changing an axis range or the character set: edit `fonts` or `unicodes`
 * below, run the script, then run `npm test` (the test reads this config).
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
export const fontsDir = path.join(root, "src/app/_fonts");

/** google/fonts commit the sources are read from (2026-03-03). */
const commit = "95f4904fc8bcf26d3420fe315560c96417c6dec7";
const raw = (file) =>
  `https://raw.githubusercontent.com/google/fonts/${commit}/${file}`;

/**
 * Basic Latin, Latin-1 (Ç Ö Ü â î û …), the Turkish letters of Latin
 * Extended-A (Ğ ğ İ ı Ş ş), Œ œ, the combining dot above (U+0307, which
 * `"İ".toLowerCase()` produces) and the punctuation, currency and arrow
 * signs the site writes. Other scripts fall back to the system fonts.
 */
export const unicodes = [
  "U+0020-007E",
  "U+00A0-00FF",
  "U+011E-011F",
  "U+0130-0131",
  "U+0152-0153",
  "U+015E-015F",
  "U+02C6",
  "U+02DC",
  "U+0307",
  "U+2013-2014",
  "U+2018-201A",
  "U+201C-201E",
  "U+2020-2022",
  "U+2026",
  "U+2030",
  "U+2032-2033",
  "U+2039-203A",
  "U+2044",
  "U+20AC",
  "U+20BA",
  "U+2122",
  "U+2190-2193",
  "U+2197",
  "U+2212",
];

/**
 * OpenType features kept: kerning, ligatures, mark positioning, Turkish
 * `locl` (the dotted i), `rvrn` (the variable font's own glyph swaps) and
 * tabular figures (`font-variant-numeric: tabular-nums`). Fractions,
 * superiors and ordinals are left out: the site never asks for them.
 */
export const layoutFeatures = [
  "kern",
  "liga",
  "calt",
  "ccmp",
  "locl",
  "mark",
  "mkmk",
  "rvrn",
  "tnum",
];

/** Turkish glyphs every generated file must map (CLAUDE.md: ı İ ş ğ ç ö ü). */
export const requiredCharacters = "ıİşŞğĞçÇöÖüÜâÂîÎûÛ";

export const fonts = [
  {
    file: "archivo-latin-tr.woff2",
    source: "ofl/archivo/Archivo[wdth,wght].ttf",
    sha256: "0e094a7d3c7c4c25cf1310c4b30014f1dae9332220b1c2c88f4fa996f0b05053",
    license: "ofl/archivo/OFL.txt",
    licenseFile: "Archivo-OFL.txt",
    licenseSha256:
      "108b4e57c9c796d3d38d0428ca7ee39de47ad93187302718d9b2d8864b9b716b",
    axes: { wght: [400, 800], wdth: [76, 125] },
    /** Preloaded on every page: the critical-path budget. */
    maxBytes: 80 * 1024,
  },
  {
    file: "martian-mono-latin-tr.woff2",
    source: "ofl/martianmono/MartianMono[wdth,wght].ttf",
    sha256: "c3467843ec1c2574b05fbcfd7147c7bfbcf63ddca8fc2bcb9d117f1bfb1b22e7",
    license: "ofl/martianmono/OFL.txt",
    licenseFile: "MartianMono-OFL.txt",
    licenseSha256:
      "ddafd2c3f37ef1d83ef284ca63e159befd3820850c5e9eded14ca52eee92c256",
    axes: { wght: [500, 700], wdth: 87.5 },
    maxBytes: 20 * 1024,
  },
];

/**
 * Both files together (the Lighthouse budget of PERF-CI-BUDGET). The
 * critical path is Archivo alone: Martian Mono is not preloaded.
 */
export const totalMaxBytes = 100 * 1024;

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function download(url, expected) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const actual = sha256(buffer);
  if (actual !== expected) {
    throw new Error(`${url}: SHA-256 ${actual}, expected ${expected}`);
  }
  return buffer;
}

function axisArgument([tag, range]) {
  return Array.isArray(range)
    ? `${tag}=${range[0]}:${range[1]}`
    : `${tag}=${range}`;
}

async function main() {
  const python = process.env.FONTTOOLS_PYTHON ?? "python3";
  const work = mkdtempSync(path.join(tmpdir(), "subset-fonts-"));
  try {
    for (const font of fonts) {
      const source = path.join(work, path.basename(font.file, ".woff2"));
      writeFileSync(
        `${source}.ttf`,
        await download(raw(font.source), font.sha256),
      );
      writeFileSync(
        path.join(fontsDir, font.licenseFile),
        await download(raw(font.license), font.licenseSha256),
      );
      execFileSync(
        python,
        [
          "-m",
          "fontTools.varLib.instancer",
          `${source}.ttf`,
          ...Object.entries(font.axes).map(axisArgument),
          "--quiet",
          "-o",
          `${source}-instance.ttf`,
        ],
        { stdio: "inherit" },
      );
      execFileSync(
        python,
        [
          "-m",
          "fontTools.subset",
          `${source}-instance.ttf`,
          `--unicodes=${unicodes.join(",")}`,
          "--flavor=woff2",
          "--no-hinting",
          `--layout-features=${layoutFeatures.join(",")}`,
          `--output-file=${source}.woff2`,
        ],
        { stdio: "inherit" },
      );
      copyFileSync(`${source}.woff2`, path.join(fontsDir, font.file));
      console.log(`wrote src/app/_fonts/${font.file}`);
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await main();
}
