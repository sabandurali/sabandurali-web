import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  brandLogo,
  brandLogoOnDark,
  brandNameMark,
  publishedBrandFiles,
  webManifestIcons,
  webManifestPath,
} from "./brand";
import { siteSocialImage } from "./site";

const root = fileURLToPath(new URL("../../", import.meta.url));
const pkg = `${root}brand/saban-durali-kimlik-v1/`;
const read = (path: string) => readFileSync(`${root}${path}`);

test("every published brand file is the package file, byte for byte", () => {
  const packageFolders = ["logo", "wordmark", "symbol", "graphic"];
  const packageSvgs = packageFolders.flatMap((folder) =>
    readdirSync(`${pkg}${folder}`)
      .filter((name) => name.endsWith(".svg"))
      .map((name) => ({ folder, name })),
  );
  // public/brand/ holds every package SVG and no other SVG.
  assert.deepEqual(
    readdirSync(`${root}public/brand`)
      .filter((name) => name.endsWith(".svg"))
      .sort(),
    packageSvgs.map(({ name }) => name).sort(),
  );
  for (const { folder, name } of packageSvgs) {
    assert.ok(publishedBrandFiles.some((url) => url === `/brand/${name}`));
    assert.ok(
      read(`public/brand/${name}`).equals(
        readFileSync(`${pkg}${folder}/${name}`),
      ),
      name,
    );
  }
  assert.ok(
    read("public/eposta/saban-durali-eposta-logo@2x.png").equals(
      readFileSync(`${pkg}applications/eposta/saban-durali-eposta-logo@2x.png`),
    ),
  );
  for (const url of publishedBrandFiles) {
    assert.ok(statSync(`${root}public${url}`).isFile(), url);
  }
});

test("the logo constants match the files' viewBox", () => {
  for (const logo of [brandLogo, brandLogoOnDark, brandNameMark]) {
    const svg = read(`public${logo.src}`).toString("utf8");
    assert.match(svg, new RegExp(`viewBox="0 0 ${logo.width} ${logo.height}"`));
  }
});

test("the icons are the package's web/ files", () => {
  for (const name of [
    "favicon.ico",
    "icon.png",
    "icon.svg",
    "apple-icon.png",
  ]) {
    assert.ok(
      read(`src/app/${name}`).equals(readFileSync(`${pkg}web/${name}`)),
      name,
    );
  }
  // An icon in public/ under these names would shadow the app/ convention.
  for (const name of ["favicon.ico", "icon.png", "apple-touch-icon.png"]) {
    assert.throws(() => statSync(`${root}public/${name}`), name);
  }
});

test("the web app manifest is valid, Turkish first and lists its icons", async () => {
  const manifest: unknown = JSON.parse(
    read(`public${webManifestPath}`).toString("utf8"),
  );
  assert.ok(typeof manifest === "object" && manifest !== null);
  assert.deepEqual(
    {
      name: Reflect.get(manifest, "name"),
      short_name: Reflect.get(manifest, "short_name"),
      lang: Reflect.get(manifest, "lang"),
      start_url: Reflect.get(manifest, "start_url"),
      background_color: Reflect.get(manifest, "background_color"),
      theme_color: Reflect.get(manifest, "theme_color"),
    },
    {
      name: "Şaban Durali",
      short_name: "Şaban Durali",
      lang: "tr",
      start_url: "/",
      background_color: "#eef2f1",
      theme_color: "#0a3352",
    },
  );
  const icons: unknown = Reflect.get(manifest, "icons");
  assert.ok(Array.isArray(icons));
  assert.deepEqual(
    icons.map((icon: unknown) =>
      typeof icon === "object" && icon !== null
        ? Reflect.get(icon, "src")
        : null,
    ),
    [...webManifestIcons],
  );
  for (const icon of icons) {
    assert.ok(typeof icon === "object" && icon !== null);
    const src = Reflect.get(icon, "src");
    const sizes = Reflect.get(icon, "sizes");
    assert.ok(typeof src === "string" && typeof sizes === "string");
    const { width, height, format } = await sharp(
      `${root}public${src}`,
    ).metadata();
    assert.equal(format, "png", src);
    assert.equal(`${width}x${height}`, sizes, src);
  }
});

test("the shared share image is the package's Open Graph image", async () => {
  const { width, height, format } = await sharp(
    `${root}public/brand/site-og.jpg`,
  ).metadata();
  assert.deepEqual([format, width, height], ["jpeg", 1200, 630]);
  const alt = readFileSync(`${pkg}web/opengraph-image.alt.txt`, "utf8").trim();
  assert.ok(siteSocialImage.alt.startsWith(alt));
  assert.match(siteSocialImage.alt, /Research and Knowledge Platform$/);
});
