import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { istanbulYear, withCurrentYear } from "./copyright";
import ErrorScreen, { getErrorDigest, getErrorTexts } from "./ErrorScreen";
import { getFooterLinkGroups } from "./footer-links";
import { getLanguageOptions } from "./header-content";
import LanguageSwitcher from "./LanguageSwitcher";
import { createRootLayoutMetadata } from "./root-metadata";
import SearchLink, { getSearchLink } from "./SearchLink";
import Wordmark from "./Wordmark";
import { shouldCloseOnEscape, shouldDismissOnOutside } from "../ui/Disclosure";
import Disclosure from "../ui/Disclosure";
import NavMenu from "../ui/NavMenu";
import {
  getFooterSitemapGroups,
  getStaticFooterGroups,
} from "../../content/navigation/static-navigation";
import { withFooterSitemap } from "../../content/navigation/navigation-fallback";
import { workspaces } from "../../content/workspaces";
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
      o.translated,
    ]),
    [
      ["TR", "/iletisim", true, true],
      // The contact page has an English counterpart; "/en" is not it.
      ["EN", "/en", false, false],
    ],
  );
  assert.deepEqual(
    getLanguageOptions("tr", contactPaths).map((o) => o.translated),
    [true, true],
  );
  // The home pages are each other's translation.
  assert.deepEqual(
    getLanguageOptions("en").map((o) => o.translated),
    [true, true],
  );
});

test("LANG-SWITCH-FALLBACK: hreflang of the language links equals <html lang>", () => {
  for (const option of getLanguageOptions("tr")) {
    assert.equal(option.hrefLang, option.locale);
  }
  for (const layout of ["src/app/(tr)/layout.tsx", "src/app/(en)/layout.tsx"]) {
    const lang = /<html lang="(\w+)"/.exec(read(layout))?.[1];
    assert.ok(
      getLanguageOptions("tr").some((option) => option.hrefLang === lang),
      layout,
    );
  }
});

test("LanguageSwitcher: visible code in the name, lang and hreflang per link", () => {
  const html = renderToStaticMarkup(
    h(LanguageSwitcher, { locale: "en", label: "Language selection" }),
  );
  assert.match(html, /<ul aria-label="Language selection"/);
  assert.match(
    html,
    /hrefLang="tr" lang="tr"[^>]*>TR<span class="sr-only"> Türkçe/,
  );
  assert.match(
    html,
    /lang="en" aria-current="true"[^>]*>EN<span class="sr-only"> English/,
  );
  assert.equal([...html.matchAll(/aria-current/g)].length, 1);
  // The English home has its Turkish translation: no note.
  assert.doesNotMatch(html, /aria-describedby|Yalnızca/);
});

test("LANG-SWITCH-FALLBACK: a page without translation says so next to the other language", () => {
  const html = renderToStaticMarkup(
    h(LanguageSwitcher, {
      locale: "tr",
      label: "Dil seçimi",
      hrefs: { tr: "/hakkimda", en: "/en" },
    }),
  );
  const describedBy =
    /<a hrefLang="en"[^>]*aria-describedby="([^"]+)"[^>]*href="\/en"/.exec(
      html,
    )?.[1];
  assert.ok(describedBy, html);
  assert.match(
    html,
    new RegExp(`<p id="${describedBy}" lang="en"[^>]*>Only in Turkish</p>`),
  );
  assert.equal([...html.matchAll(/aria-describedby/g)].length, 1);

  const english = renderToStaticMarkup(
    h(LanguageSwitcher, {
      locale: "en",
      label: "Language selection",
      hrefs: { tr: "/kitaplar", en: "/en/books/a-review" },
    }),
  );
  assert.match(english, /<p id="[^"]+" lang="tr"[^>]*>Yalnızca İngilizce<\/p>/);
  // A translated detail page shows no note.
  const translated = renderToStaticMarkup(
    h(LanguageSwitcher, {
      locale: "en",
      label: "Language selection",
      hrefs: { tr: "/kitaplar/bir-inceleme", en: "/en/books/a-review" },
    }),
  );
  assert.doesNotMatch(translated, /Yalnızca|aria-describedby/);
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

test("FOOTER-SITEMAP: the footer maps the site in both languages", () => {
  const hrefsOf = (locale: "tr" | "en") =>
    getFooterLinkGroups(
      withFooterSitemap(
        getFooterSitemapGroups(locale),
        getStaticFooterGroups(homeContent[locale].footer),
      ),
    ).flatMap((group) => group.links);
  const tr = hrefsOf("tr");
  const en = hrefsOf("en");
  for (const workspace of workspaces) {
    assert.ok(
      tr.some((link) => link.href === `/${workspace.key}`),
      workspace.key,
    );
  }
  for (const href of [
    "/calisma-alanlari",
    "/istanbul/ilceler",
    "/makaleler",
    "/kitaplar",
    "/fotograflar",
    "/hakkimda",
    "/ara",
    "/feed.xml",
    contactPaths.tr,
    privacyPaths.tr,
  ]) {
    assert.ok(
      tr.some((link) => link.href === href),
      href,
    );
  }
  for (const href of [
    "/en/articles",
    "/en/books",
    "/en/photography",
    "/en#about",
    "/en#istanbul",
    "/en/search",
    "/en/feed.xml",
    contactPaths.en,
    privacyPaths.en,
  ]) {
    assert.ok(
      en.some((link) => link.href === href),
      href,
    );
  }
  // The other language is named in its own language and marked as such.
  assert.deepEqual(
    tr.filter((link) => link.lang !== undefined),
    [
      {
        id: "footer-language",
        label: "English",
        href: "/en",
        newTab: false,
        lang: "en",
      },
    ],
  );
  assert.deepEqual(
    en.filter((link) => link.lang !== undefined),
    [
      {
        id: "footer-language",
        label: "Türkçe",
        href: "/",
        newTab: false,
        lang: "tr",
      },
    ],
  );
  // Each page once per footer.
  for (const links of [tr, en]) {
    const hrefs = links.map((link) => link.href);
    assert.equal(new Set(hrefs).size, hrefs.length);
  }
});

test("FOOTER-SITEMAP: a CMS link replaces the site map's link to the same page", () => {
  const cms = [
    {
      id: "cms",
      title: "CI test bağlantıları",
      links: [
        {
          id: "cms-about",
          label: "Hakkımda (CMS)",
          href: "/hakkimda/",
          external: false,
          newTab: false,
          children: [],
        },
      ],
    },
  ];
  const groups = withFooterSitemap(getFooterSitemapGroups("tr"), cms);
  const links = groups.flatMap((group) => group.links);
  assert.deepEqual(
    links.filter((link) => link.href?.startsWith("/hakkimda")).map((l) => l.id),
    ["cms-about"],
  );
  assert.equal(groups.at(-1)?.title, "CI test bağlantıları");
  // A site map group whose every link the CMS already has is dropped.
  const duplicate = {
    id: "dup",
    label: "Hakkımda",
    href: "/hakkimda",
    external: false,
    newTab: false,
    children: [],
  };
  assert.deepEqual(
    withFooterSitemap([{ id: "x", title: "Boş", links: [duplicate] }], cms).map(
      (group) => group.id,
    ),
    ["cms"],
  );
});

test("FOOTER-SITEMAP: footer and header link the search page without prefetch", () => {
  for (const locale of ["tr", "en"] as const) {
    const html = renderToStaticMarkup(h(SearchLink, { locale }));
    const { href, label } = getSearchLink(locale);
    assert.match(html, new RegExp(`^<a [^>]*href="${href}"`));
    assert.match(
      html,
      new RegExp(`</svg><span class="max-sm:sr-only">${label}</span></a>$`),
    );
    assert.match(html, /<svg aria-hidden="true"/);
  }
  assert.deepEqual(
    [getSearchLink("tr").href, getSearchLink("en").href],
    ["/ara", "/en/search"],
  );
  assert.match(
    read("src/components/layout/Header.tsx"),
    /<SearchLink locale=\{locale\} \/>/,
  );
  // next/link renders no trace of `prefetch`, so the sources are read.
  assert.match(
    read("src/components/layout/SearchLink.tsx"),
    /<Link\s+href=\{href\}[\s\S]*?prefetch=\{false\}[\s\S]*?>/,
  );
  const footer = read("src/components/layout/Footer.tsx");
  assert.match(footer, /prefetch=\{false\}/);
  assert.match(footer, /lang=\{link\.lang\}\s+hrefLang=\{link\.lang\}/);
  assert.match(
    read("src/content/navigation/navigation-data-source.ts"),
    /return withFooterSitemap\(sitemap, staticGroups\);[\s\S]*return withFooterSitemap\(\s*sitemap,\s*resolveFooterGroups\(/,
  );
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

test("FRONTEND-1: the mobile menu closes when focus or a tap moves outside", () => {
  const inside = { id: "panel-link" };
  const outside = { id: "breadcrumb-home" };
  const container = {
    contains: (node: { id: string } | null) => node === inside,
  };
  assert.equal(shouldDismissOnOutside(true, container, outside), true);
  assert.equal(shouldDismissOnOutside(true, container, inside), false);
  assert.equal(shouldDismissOnOutside(true, container, null), false);
  assert.equal(shouldDismissOnOutside(false, container, outside), false);
  assert.equal(shouldDismissOnOutside(true, null, outside), false);

  const disclosure = read("src/components/ui/Disclosure.tsx");
  assert.match(disclosure, /onBlur=\{handleBlur\}/);
  assert.match(disclosure, /addEventListener\("pointerdown"/);
  const mobile = read("src/components/layout/HeaderNavigation.tsx");
  assert.match(
    mobile.slice(mobile.indexOf("export function MobileNavigation")),
    /<Disclosure[^>]*\bdismissOnOutside\b/,
  );
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
  // WCAG 3.1.2: the English half of the bilingual skip link is marked.
  assert.match(
    global,
    /<SkipLink>\s*İçeriğe geç · <span lang="en">Skip to content<\/span>\s*<\/SkipLink>/,
  );
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
    // FRONTEND-8: the pre-atlas shell API (ignored homeHref / compact) is gone.
    assert.doesNotMatch(
      read(file),
      /@deprecated|\bhomeHref\b|\bcompact\?:/,
      file,
    );
  }
});

test("GLOBAL-ERROR: a branded, bilingual root error screen without CMS reads", () => {
  const source = read("src/app/global-error.tsx");
  assert.match(source, /^"use client";/);
  assert.match(source, /export default function GlobalError\(/);
  assert.match(source, /<html lang="tr"[^>]*className=\{fontVariables\}/);
  assert.match(source, /import "\.\/globals\.css";/);
  assert.match(
    source,
    /<body>\s*<title>[^<]+<\/title>\s*<meta name="robots" content="noindex" \/>\s*<SkipLink>\s*İçeriğe geç · <span lang="en">Skip to content<\/span>\s*<\/SkipLink>/,
  );
  assert.match(
    source,
    /<ErrorScreen\s+locale="tr"\s+error=\{error\}\s+retry=\{retry\}/,
  );
  assert.match(source, /<section\s+lang="en"/);
  // No data layer: the screen must render when the CMS or the root layout fails.
  assert.doesNotMatch(source, /@\/content\/|payload|server-only|async /);

  const html = renderToStaticMarkup(
    h(ErrorScreen, {
      locale: "tr",
      error: { digest: "abc123" },
      retry: () => undefined,
      aside: h("section", { lang: "en" }, "English block"),
    }),
  );
  assert.match(html, /Sayfa şu anda gösterilemiyor\./);
  assert.match(html, /Hata kodu: abc123/);
  assert.match(html, /<section lang="en">English block<\/section>/);
  assert.equal(getErrorTexts("en").retry, "Try again");
});

test("FRONTEND-6: every long page shell, the home page included, has BackToTop", () => {
  const shells = [
    "src/components/HomePage.tsx",
    "src/components/workspaces/PageShell.tsx",
  ];
  for (const file of [
    "src/components/districts/DistrictEditorialGuidePage.tsx",
    "src/components/districts/DistrictNewsListPage.tsx",
    "src/app/(tr)/istanbul/ilceler/page.tsx",
  ]) {
    assert.match(read(file), /<PageShell\b/, `${file}: PageShell`);
  }
  for (const file of shells) {
    const source = read(file);
    assert.match(source, /<div id="top"/, `${file}: #top target`);
    assert.match(
      source,
      /<BackToTop label=\{[\w.]+\.backToTopLabel\} \/>/,
      `${file}: BackToTop`,
    );
  }
});

test("COMPLETENESS-2: the footer copyright year follows the Istanbul calendar", () => {
  // 31 Dec 2026 22:30 UTC is already 1 Jan 2027 in Istanbul (UTC+3).
  const newYear = new Date("2026-12-31T22:30:00Z");
  assert.equal(istanbulYear(newYear), 2027);
  assert.equal(istanbulYear(new Date("2026-12-31T20:30:00Z")), 2026);
  for (const locale of ["tr", "en"] as const) {
    const line = withCurrentYear(homeContent[locale].footer.copyright, newYear);
    assert.match(line, /^© 2027 Şaban Durali\. /);
  }
  assert.equal(withCurrentYear("Şaban Durali", newYear), "Şaban Durali");
  assert.match(
    read("src/components/layout/Footer.tsx"),
    /withCurrentYear\(content\.copyright, new Date\(\)\)/,
  );
});

test("ARCHITECTURE-3: the site shell is wired only in PageShell, the home page and the 404", () => {
  // A page that renders Header, Footer or BackToTop itself drifts from the
  // shell the moment one of them gets a new prop or landmark fix.
  const files = (directory: string): string[] =>
    readdirSync(`${root}${directory}`, { withFileTypes: true }).flatMap(
      (entry) => {
        const file = `${directory}/${entry.name}`;
        if (entry.isDirectory()) return files(file);
        return /\.tsx$/.test(entry.name) ? [file] : [];
      },
    );
  const direct = [...files("src/components"), ...files("src/app")].filter(
    (file) =>
      !file.includes("/admin/") &&
      /<(?:Header|Footer|BackToTop)\b/.test(read(file)),
  );
  assert.deepEqual(direct.sort(), [
    "src/components/HomePage.tsx",
    "src/components/layout/NotFoundScreen.tsx",
    "src/components/workspaces/PageShell.tsx",
  ]);
});
