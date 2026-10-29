import assert from "node:assert/strict";
import test from "node:test";
import { siteLocales as metadataLocales } from "../lib/metadata";
import type { DateLanguage } from "../lib/format-date";
import type { ArticleLanguage } from "./articles/types";
import type { Locale } from "./homeContent";
import { isSiteLocale, siteLocales, type SiteLocale } from "./locales";
import type { MediaLocale } from "./media";
import type { PublicPageLanguage } from "./pages/public-types";
import type { PhotoLanguage } from "./photos/types";
import type { RichTextLocale } from "./rich-text/prepare-rich-text";

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
  ];
  assert.equal(same.length, 7);
});
