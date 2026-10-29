import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getErrorDigest } from "./ErrorScreen";
import { getFooterLinkGroups } from "./footer-links";
import { getLanguageOptions } from "./header-content";
import LanguageSwitcher from "./LanguageSwitcher";
import { createRootLayoutMetadata } from "./root-metadata";
import Wordmark from "./Wordmark";
import { shouldCloseOnEscape } from "../ui/Disclosure";
import Disclosure from "../ui/Disclosure";
import NavMenu from "../ui/NavMenu";
import { getStaticFooterGroups } from "../../content/navigation/static-navigation";
import { homeContent } from "../../content/homeContent";
import { contactPaths, privacyPaths } from "../../config/site";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const read = (path: string) => readFileSync(`${root}${path}`, "utf8");

test("language options fall back to the home pages and mark the current one", () => {
  assert.deepEqual(
    getLanguageOptions("tr", { tr: "/iletisim" }).map((o) => [
      o.code,
      o.href,
      o.current,
    ]),
    [
      ["TR", "/iletisim", true],
      ["EN", "/en", false],
    ],
  );
});

test("LanguageSwitcher: visible code in the name, lang and hreflang per link", () => {
  const html = renderToStaticMarkup(
    h(LanguageSwitcher, { locale: "en", label: "Language selection" }),
  );
  assert.match(html, /^<ul aria-label="Language selection"/);
  assert.match(
    html,
    /hrefLang="tr-TR" lang="tr"[^>]*>TR<span class="sr-only"> Türkçe/,
  );
  assert.match(
    html,
    /lang="en" aria-current="true"[^>]*>EN<span class="sr-only"> English/,
  );
  assert.equal([...html.matchAll(/aria-current/g)].length, 1);
});

test("Wordmark: home link named by its visible text, Turkish name marked", () => {
  const html = renderToStaticMarkup(h(Wordmark, { locale: "en" }));
  assert.match(html, /^<a [^>]*href="\/en"/);
  assert.match(
    html,
    /<span lang="tr" class="block type-wordmark">ŞABAN DURALİ<\/span>/,
  );
  assert.match(html, /RESEARCH AND KNOWLEDGE PLATFORM/);
  assert.match(html, /<span class="sr-only">, home page<\/span>/);
  const plain = renderToStaticMarkup(
    h(Wordmark, { locale: "tr", asLink: false, tone: "on-sea" }),
  );
  assert.match(plain, /^<p /);
  assert.doesNotMatch(plain, /<a /);
});

test("footer groups: flat real links, no empty group, DOM-safe ids", () => {
  const groups = getFooterLinkGroups([
    { id: "x y", title: "Empty", links: [] },
    {
      id: "cms",
      title: "Bağlantılar",
      links: [
        {
          id: "parent",
          label: "Parent",
          href: null,
          external: false,
          newTab: false,
          children: [
            {
              id: "child",
              label: "Child",
              href: "/a",
              external: false,
              newTab: true,
              children: [],
            },
          ],
        },
      ],
    },
  ]);
  assert.deepEqual(groups, [
    {
      id: "1",
      title: "Bağlantılar",
      links: [{ id: "child", label: "Child", href: "/a", newTab: true }],
    },
  ]);
  for (const locale of ["tr", "en"] as const) {
    const hrefs = getFooterLinkGroups(
      getStaticFooterGroups(homeContent[locale].footer),
    ).flatMap((group) => group.links.map((l) => l.href));
    assert.ok(hrefs.includes(privacyPaths[locale]), locale);
    assert.ok(hrefs.includes(contactPaths[locale]), locale);
  }
});

test("FE-7: root metadata has Open Graph and Twitter, never a canonical or og:url", () => {
  for (const locale of ["tr", "en"] as const) {
    const metadata = createRootLayoutMetadata(locale);
    assert.equal(metadata.alternates, undefined);
    const og = metadata.openGraph;
    assert.ok(og);
    assert.equal("url" in og, false);
    assert.equal(og.siteName, "Şaban Durali");
    assert.equal(og.locale, locale === "tr" ? "tr_TR" : "en_US");
    assert.equal("type" in og ? og.type : undefined, "website");
    assert.ok(Array.isArray(og.images) && og.images.length === 1);
    const twitter = metadata.twitter;
    assert.ok(twitter);
    assert.equal(
      "card" in twitter ? twitter.card : undefined,
      "summary_large_image",
    );
  }
});

test("getErrorDigest returns only a well-formed digest", () => {
  assert.equal(getErrorDigest({ digest: "12345abc" }), "12345abc");
  assert.equal(getErrorDigest({ digest: "<script>" }), null);
  assert.equal(getErrorDigest(new Error("secret")), null);
  assert.equal(getErrorDigest("x"), null);
  assert.equal(getErrorDigest(null), null);
});

test("Disclosure: Escape closes one layer; controlled state and inline button", () => {
  assert.equal(shouldCloseOnEscape("Escape", true, false), true);
  assert.equal(shouldCloseOnEscape("Escape", true, true), false);
  assert.equal(shouldCloseOnEscape("Escape", false, false), false);
  assert.equal(shouldCloseOnEscape("Enter", true, false), false);
  const html = renderToStaticMarkup(
    h(Disclosure, {
      summary: "Menü",
      open: true,
      fullWidth: false,
      children: "x",
    }),
  );
  assert.match(html, /aria-expanded="true"/);
  assert.doesNotMatch(html, /hidden=""/);
  assert.doesNotMatch(html, /w-full/);
});

test("NavMenu: an active section is bold with the bar but not aria-current", () => {
  const html = renderToStaticMarkup(
    h(NavMenu, {
      label: "Ana navigasyon",
      items: [
        { id: "a", label: "Makaleler", href: "/makaleler", active: true },
      ],
    }),
  );
  assert.doesNotMatch(html, /aria-current/);
  assert.match(html, /font-bold/);
  assert.match(html, /after:bg-signal/);
});

test("NavMenu bar: tight gaps below 1440 px so eight sections keep one row", () => {
  const html = renderToStaticMarkup(
    h(NavMenu, {
      label: "Ana navigasyon",
      layout: "bar",
      items: [{ id: "a", label: "Makaleler", href: "/makaleler" }],
    }),
  );
  assert.match(html, /gap-x-3 min-\[90rem\]:gap-x-8/);
  assert.match(html, /px-0\.5/);
  assert.doesNotMatch(html, /2\.2vw/);
});

test("shell sources: atlas layouts, retry, English 404 catch-all, global 404", () => {
  for (const layout of ["src/app/(tr)/layout.tsx", "src/app/(en)/layout.tsx"]) {
    const source = read(layout);
    assert.doesNotMatch(source, /scheme-dark|bg-background|text-foreground/);
    assert.match(source, /<body>\s*<SkipLink>/, `${layout}: SkipLink first`);
    assert.match(source, /export const revalidate = 3600;/);
    assert.match(source, /createRootLayoutMetadata\("(tr|en)"\)/);
  }
  for (const error of ["src/app/(tr)/error.tsx", "src/app/(en)/error.tsx"]) {
    const source = read(error);
    assert.doesNotMatch(source, /unstable_retry/);
    assert.match(source, /retry=\{retry\}/);
  }
  assert.match(read("src/app/(en)/en/[...missing]/page.tsx"), /notFound\(\)/);
  const global = read("src/app/global-not-found.tsx");
  assert.match(global, /fontVariables/);
  assert.match(global, /<body>\s*<SkipLink>/);
  assert.match(global, /lang="en"/);
  for (const file of [
    "src/components/layout/Header.tsx",
    "src/components/layout/Footer.tsx",
    "src/components/layout/StatusMessage.tsx",
  ]) {
    assert.doesNotMatch(
      read(file),
      /\b(bg-background|text-foreground|text-ivory|accent|gold|text-muted\b)/,
      file,
    );
  }
});
