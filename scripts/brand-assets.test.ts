import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

// brand-assets/ is not deployed, but the repository is public, so every
// file in it is redistributed (review TESTS-INFRA-5). The owner decides
// whether the photos without a recorded licence stay (docs/NEXT-STEPS.md §7,
// decision 5); until then the folder is frozen: nothing may be added
// without a source and licence, and the pending set may only shrink.

/** The identity masters the owner made; README describes each. */
const ownBrandFiles = [
  "brand-board.png",
  "icons/app-icon.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-16.png",
  "icons/favicon-32.png",
  "icons/favicon-512.png",
  "icons/favicon-64.png",
  "logo-horizontal.png",
  "logo-vertical.png",
  "monogram.png",
  "office-wall-mockup.png",
  "profile-icon.png",
];

/** Files waiting for the owner's licence decision (NEXT-STEPS decision 5). */
const pendingOwnerDecision = [
  "retired-home-images/arastirma-analiz.jpg",
  "retired-home-images/fotograf.jpg",
  "retired-home-images/gayrimenkul-istanbul.jpg",
  "retired-home-images/hero-istanbul-bogaz.jpg",
  "retired-home-images/kitaplar-ogrenme.jpg",
  "retired-home-images/satis-muzakere.jpg",
  "retired-home-images/yapay-zeka-teknoloji.jpg",
];

function files(directory: string, prefix = ""): string[] {
  return readdirSync(directory).flatMap((name) => {
    const full = path.join(directory, name);
    const relative = prefix ? `${prefix}/${name}` : name;
    return statSync(full).isDirectory() ? files(full, relative) : [relative];
  });
}

test("TESTS-INFRA-5: no file enters brand-assets/ without a recorded source", () => {
  const present = files("brand-assets").filter((file) => file !== "README.md");
  const known = new Set([...ownBrandFiles, ...pendingOwnerDecision]);
  const unknown = present.filter((file) => !known.has(file));
  assert.deepEqual(
    unknown,
    [],
    "record the source and licence in brand-assets/README.md and list the file here",
  );
});

test("the pending licence set only shrinks and stays documented", () => {
  const readme = readFileSync("brand-assets/README.md", "utf8");
  const nextSteps = readFileSync("docs/NEXT-STEPS.md", "utf8");
  // Each pending folder is still described as unverified in the README and
  // as an open owner decision in the handoff, or it has been removed.
  for (const folder of ["retired-home-images"]) {
    const remaining = pendingOwnerDecision.filter((file) =>
      file.startsWith(`${folder}/`),
    );
    const present = remaining.filter((file) => {
      try {
        return statSync(path.join("brand-assets", file)).isFile();
      } catch {
        return false;
      }
    });
    if (present.length === 0) continue;
    assert.ok(readme.includes(`\`${folder}/\``), folder);
    assert.ok(nextSteps.includes(`brand-assets/${folder}/`), folder);
    if (folder === "retired-home-images")
      assert.match(readme, /source and licence are not recorded/);
  }
});

test("TESTS-INFRA-4: every brand asset has a README row and the template SVGs are gone", () => {
  const readme = readFileSync("brand-assets/README.md", "utf8");
  const present = files("brand-assets").filter((file) => file !== "README.md");
  // A file is described by its own name or by its folder, in backticks.
  for (const file of present) {
    const folder = file.includes("/") ? `${file.split("/")[0]}/` : null;
    const name = path.basename(file);
    assert.ok(
      readme.includes(`\`${name}\``) ||
        (folder !== null && readme.includes(`| \`${folder}\``)),
      `${file} has no row in brand-assets/README.md`,
    );
  }
  // The create-next-app samples had no brand value and no reference.
  assert.deepEqual(
    present.filter((file) =>
      /(^|\/)(file|globe|next|vercel|window)\.svg$/.test(file),
    ),
    [],
  );
});
