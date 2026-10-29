import assert from "node:assert/strict";
import test from "node:test";
import { getSafeArticleHref } from "./articles/article-links";
import { isPublicSourceUrl } from "./districts/district-content-policy";
import { normalizeExternalNavigationUrl } from "./navigation/navigation-links";
import { mapPayloadPage } from "./pages/payload-page-mapper";
import { validatePageLink } from "../collections/validation";
import { getSafeHref } from "./links";

const credentialUrls = [
  "https://user:pass@example.org/",
  "https://user@example.org/",
  "http://:secret@example.org/",
];

test("absolute links are http(s) without credentials", () => {
  assert.equal(
    getSafeHref("https://example.org/a b"),
    "https://example.org/a%20b",
  );
  assert.equal(getSafeHref("http://example.org"), "http://example.org/");
  assert.equal(getSafeHref("http://example.org", { httpsOnly: true }), null);
  for (const value of [
    ...credentialUrls,
    "javascript:alert(1)",
    "mailto:a@b.co",
    "data:text/html,x",
    "nota url",
    "",
    "   ",
    null,
    42,
  ]) {
    assert.equal(getSafeHref(value), null, String(value));
  }
});

test("site paths and anchors only when the caller allows them", () => {
  assert.equal(getSafeHref("/makaleler/x"), null);
  assert.equal(
    getSafeHref("/makaleler/x", { allowRelative: true }),
    "/makaleler/x",
  );
  assert.equal(getSafeHref("//evil.example", { allowRelative: true }), null);
  assert.equal(
    getSafeHref("/kitaplar/x?dil=tr#not", { allowRelative: true }),
    "/kitaplar/x?dil=tr#not",
  );
  // An encoded backslash is an ordinary character of a path on this site.
  assert.equal(
    getSafeHref("/%5Cevil.example", { allowRelative: true }),
    "/%5Cevil.example",
  );
});

test("a site path that a browser resolves to another origin is refused", () => {
  // Browsers read `\` as `/` and drop TAB, LF and CR, so each of these
  // would open https://evil.example while looking like a site path.
  for (const href of [
    "/\\evil.example",
    "/\\\\evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    "/\r/evil.example",
    "/\\/evil.example",
    "/x\u0000y",
  ]) {
    const options = { allowAnchor: true, allowRelative: true };
    assert.equal(getSafeHref(href, options), null, JSON.stringify(href));
    assert.notEqual(validatePageLink(href), true, JSON.stringify(href));
    assert.equal(getSafeArticleHref(href), null, JSON.stringify(href));
  }
  assert.equal(getSafeHref("#bolum-2"), null);
  assert.equal(getSafeHref("#bolum-2", { allowAnchor: true }), "#bolum-2");
  assert.equal(getSafeHref("#Bölüm", { allowAnchor: true }), null);
});

test("every content type refuses a URL with embedded credentials", () => {
  for (const url of credentialUrls) {
    assert.equal(getSafeArticleHref(url), null, `article ${url}`);
    assert.equal(isPublicSourceUrl(url), false, `district source ${url}`);
    assert.equal(
      normalizeExternalNavigationUrl(url),
      null,
      `navigation ${url}`,
    );
  }

  const page = mapPayloadPage(
    {
      id: "page-1",
      title: "Sayfa",
      slug: "sayfa",
      summary: "Özet",
      language: "tr",
      pageType: "standard",
      _status: "published",
      publishedAt: "2026-01-01T00:00:00Z",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      layout: [
        {
          blockType: "cta",
          id: "cta-1",
          title: "Bize yazın",
          action: { label: "Aç", href: credentialUrls[0] },
        },
        {
          blockType: "cta",
          id: "cta-2",
          title: "İletişim",
          action: { label: "Yaz", href: "/iletisim" },
        },
      ],
    } as never,
    "tr",
    new Date("2026-10-29T00:00:00Z"),
  );
  assert.equal(JSON.stringify(page).includes("user:pass"), false);
  assert.deepEqual(
    page?.layout.map((block) => block.id),
    ["cta-2"],
  );
});
