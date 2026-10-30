import assert from "node:assert/strict";
import test from "node:test";
import {
  hasMeaningfulRichText,
  imageMediaFilter,
  isHttpsUrl,
  isSiteCanonicalUrl,
  validateOptionalSiteCanonical,
  validatePageLink,
} from "./validation";
import { getSafeHref } from "@/content/links";

test("external source links must be plain https URLs", () => {
  for (const url of [
    "https://www.esenler.bel.tr/haber/1",
    "https://example.com",
    "https://example.com/a?b=c#d",
  ]) {
    assert.equal(isHttpsUrl(url), true, url);
  }

  for (const url of [
    "http://example.com",
    "javascript:alert(1)",
    "data:text/html,hi",
    "mailto:someone@example.com",
    "//example.com/path",
    "/relative/path",
    "https://user:pass@example.com",
    " https://example.com",
    "https://exa mple.com",
    "",
    null,
    42,
  ]) {
    assert.equal(isHttpsUrl(url), false, String(url));
  }
});

test("canonical URLs stay on this site", () => {
  for (const url of [
    "/kitaplar/derin-calisma",
    "/en/books/deep-work",
    "https://www.sabandurali.com/makaleler/ornek",
    "https://www.sabandurali.com",
  ]) {
    assert.equal(isSiteCanonicalUrl(url), true, url);
  }

  for (const url of [
    "https://sabandurali.com/kitaplar/x",
    "https://www.sabandurali.com.evil.example/x",
    "https://www.sabanduraly.com/kitaplar/x",
    "http://www.sabandurali.com/kitaplar/x",
    "//www.sabandurali.com/kitaplar/x",
    "/kitaplar/x?ref=1",
    "/kitaplar/x#bolum",
    "/kitaplar\\x",
    "kitaplar/x",
    "javascript:alert(1)",
  ]) {
    assert.equal(isSiteCanonicalUrl(url), false, url);
  }

  assert.equal(validateOptionalSiteCanonical(""), true);
  assert.equal(validateOptionalSiteCanonical(null), true);
  assert.equal(validateOptionalSiteCanonical(undefined), true);
  assert.match(
    String(validateOptionalSiteCanonical("https://example.com/x")),
    /site içi bir yol/,
  );
});

test("rich text needs visible text or an upload", () => {
  const paragraph = (text: string) => ({
    root: {
      children: [{ children: [{ text, type: "text" }], type: "paragraph" }],
    },
  });

  assert.equal(hasMeaningfulRichText(paragraph("Merhaba")), true);
  assert.equal(hasMeaningfulRichText(paragraph("   ")), false);
  assert.equal(
    hasMeaningfulRichText({
      root: {
        children: [{ relationTo: "media", type: "upload", value: "m1" }],
      },
    }),
    true,
  );
  assert.equal(hasMeaningfulRichText({ root: { children: [] } }), false);
  assert.equal(hasMeaningfulRichText(null), false);
  assert.equal(hasMeaningfulRichText({}), false);
});

test("image fields only offer image media", () => {
  assert.deepEqual(imageMediaFilter, { mimeType: { contains: "image/" } });
});

test("ARCHITECTURE-10: page block links follow the public link rule", () => {
  for (const link of [
    "#bolum-2",
    "/makaleler/ornek",
    "https://example.com/a?b=c",
    "http://example.com",
  ]) {
    assert.equal(validatePageLink(link), true, link);
    assert.notEqual(
      getSafeHref(link, { allowAnchor: true, allowRelative: true }),
      null,
      link,
    );
  }

  for (const link of [
    "",
    "   ",
    "https://user:pass@example.com",
    "http://user@example.com/",
    "//example.com/path",
    "javascript:alert(1)",
    "mailto:someone@example.com",
    "#Bolum",
    42,
  ]) {
    assert.equal(typeof validatePageLink(link), "string", String(link));
  }
});
