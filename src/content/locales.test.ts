import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { siteLocales as metadataLocales } from "../lib/metadata";
import type { DateLanguage } from "../lib/format-date";
import type { ArticleLanguage } from "./articles/types";
import type { Locale } from "./homeContent";
import { isSiteLocale, siteLocales, type SiteLocale } from "./locales";
import type { MediaLocale } from "./media";
import type { PublicPageLanguage } from "./pages/public-types";
import type { PhotoLanguage } from "./photos/types";
import type { RichTextLocale } from "./rich-text/prepare-rich-text";
import type { HeaderLocale } from "../components/layout/header-content";
import type { UiLocale } from "../components/ui/strings";

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

test("one locale list: Turkish first, then English", () => {
  assert.deepEqual(siteLocales, ["tr", "en"]);
  assert.equal(metadataLocales, siteLocales);
  assert.equal(isSiteLocale("tr"), true);
  assert.equal(isSiteLocale("en"), true);
  for (const value of ["de", "TR", "", null, undefined, 1]) {
    assert.equal(isSiteLocale(value), false, String(value));
  }
});

test("per-module language types are the site locale", () => {
  const same: Array<true> = [
    true satisfies Same<ArticleLanguage, SiteLocale>,
    true satisfies Same<PhotoLanguage, SiteLocale>,
    true satisfies Same<PublicPageLanguage, SiteLocale>,
    true satisfies Same<MediaLocale, SiteLocale>,
    true satisfies Same<RichTextLocale, SiteLocale>,
    true satisfies Same<DateLanguage, SiteLocale>,
    true satisfies Same<Locale, SiteLocale>,
    true satisfies Same<UiLocale, SiteLocale>,
    true satisfies Same<HeaderLocale, SiteLocale>,
  ];
  assert.equal(same.length, 9);
});

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const candidate = path.join(directory, entry);
    if (statSync(candidate).isDirectory()) return sourceFiles(candidate);
    return /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)
      ? [candidate]
      : [];
  });
}

test("no layer spells a locale union of its own", () => {
  const source = path.dirname(fileURLToPath(import.meta.url));
  const files = [
    ...sourceFiles(source),
    ...["lib", "components", "collections", "globals", "blocks", "app"].flatMap(
      (directory) => sourceFiles(path.join(source, "..", directory)),
    ),
  ];
  const offenders = files.filter((file) =>
    /"(?:tr|en)"\s*\|\s*"(?:tr|en)"/.test(readFileSync(file, "utf8")),
  );

  assert.deepEqual(
    offenders.map((file) => path.relative(source, file)),
    [],
  );
});
