import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  findRouteParity,
  isTranslationPath,
  matchesRoute,
  routeParity,
} from "./route-parity";

const appDir = fileURLToPath(new URL("../app/", import.meta.url));

/** Route patterns of every page.tsx below a route group folder. */
function pageRoutes(group: string): string[] {
  const root = path.join(appDir, group);
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      if (entry.name !== "page.tsx") return [];
      const relative = path.relative(root, dir).split(path.sep).join("/");
      return [`/${relative}`.replace(/\/$/, "") || "/"];
    });
  return walk(root);
}

const turkishRoutes = pageRoutes("(tr)");
const englishRoutes = pageRoutes("(en)");

test("LANG-SWITCH-FALLBACK: every Turkish and English page route is in the manifest", () => {
  assert.ok(turkishRoutes.includes("/") && englishRoutes.includes("/en"));
  const trPatterns = new Set(
    routeParity.flatMap((entry) => ("tr" in entry ? [entry.tr] : [])),
  );
  const enPatterns = new Set(
    routeParity.flatMap((entry) => ("en" in entry ? [entry.en] : [])),
  );
  assert.deepEqual(
    turkishRoutes.filter((route) => !trPatterns.has(route)),
    [],
    "Turkish routes missing from src/content/route-parity.ts",
  );
  assert.deepEqual(
    englishRoutes.filter((route) => !enPatterns.has(route)),
    [],
    "English routes missing from src/content/route-parity.ts",
  );
});

test("LANG-SWITCH-FALLBACK: pairs exist in both languages or in neither; every exception has a reason", () => {
  for (const entry of routeParity) {
    if (entry.kind === "pair") {
      assert.equal(
        turkishRoutes.includes(entry.tr),
        englishRoutes.includes(entry.en),
        `${entry.tr} ↔ ${entry.en}`,
      );
      continue;
    }
    assert.ok(entry.reason.length > 20, JSON.stringify(entry));
    if (entry.kind === "tr-only") {
      assert.ok(turkishRoutes.includes(entry.tr), entry.tr);
    } else {
      assert.ok(englishRoutes.includes(entry.en), entry.en);
    }
  }
});

test("route patterns: one segment per placeholder, literal routes win", () => {
  assert.equal(matchesRoute("/makaleler/[slug]", "/makaleler/a"), true);
  assert.equal(matchesRoute("/makaleler/[slug]", "/makaleler"), false);
  assert.equal(matchesRoute("/", "/"), true);
  assert.equal(matchesRoute("/[slug]", "/"), false);
  assert.equal(matchesRoute("/en/[...missing]", "/en/x"), false);
  assert.equal(matchesRoute("/hakkimda", "/hakkimda#biyografi"), true);
  assert.equal(findRouteParity("/iletisim", "tr")?.kind, "pair");
  assert.equal(findRouteParity("/bir-sayfa", "tr")?.kind, "tr-only");
  assert.equal(
    findRouteParity("/istanbul/ilceler/esenler/haberler?sayfa=2", "tr")?.kind,
    "tr-only",
  );
});

test("translations: the counterpart is a translation, a home or list fallback is not", () => {
  assert.equal(isTranslationPath("/", "tr", "/en", "en"), true);
  assert.equal(isTranslationPath("/iletisim", "tr", "/en/contact", "en"), true);
  assert.equal(
    isTranslationPath("/makaleler/a", "tr", "/en/articles/b", "en"),
    true,
  );
  assert.equal(
    isTranslationPath("/makaleler/a", "tr", "/en/articles", "en"),
    false,
  );
  assert.equal(
    isTranslationPath("/en/books/b", "en", "/kitaplar", "tr"),
    false,
  );
  assert.equal(isTranslationPath("/hakkimda", "tr", "/en", "en"), false);
  assert.equal(
    isTranslationPath("/istanbul/ilceler/esenler", "tr", "/en", "en"),
    false,
  );
  assert.equal(isTranslationPath("/hakkimda", "tr", "/hakkimda", "tr"), true);
});
