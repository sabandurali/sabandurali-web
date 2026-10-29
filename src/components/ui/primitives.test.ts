import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createElement as h, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Breadcrumb, { homeBreadcrumbItem } from "./Breadcrumb";
import { Button, ButtonLink } from "./Button";
import Card, { cardFocusClassName, cardFrameClassName } from "./Card";
import { cx } from "./cx";
import Disclosure from "./Disclosure";
import DistrictKeyMap from "./DistrictKeyMap";
import DistrictTileMap from "./DistrictTileMap";
import EmptyState from "./EmptyState";
import Eyebrow from "./Eyebrow";
import FactTable from "./FactTable";
import {
  Field,
  Input,
  Select,
  describedBy,
  type FieldControlProps,
} from "./Field";
import { Credit, Figure } from "./Figure";
import FormStatus, { resultFocusTarget } from "./FormStatus";
import GridRef from "./GridRef";
import { LineChip } from "./LineChip";
import NavMenu from "./NavMenu";
import PageIntro from "./PageIntro";
import Pagination from "./Pagination";
import PlateTitle, { plateCharacters } from "./PlateTitle";
import SectionSign from "./SectionSign";
import SkipLink from "./SkipLink";
import {
  SourceRef,
  SourceRefList,
  formatSourceCode,
  sourceAnchorId,
} from "./SourceRef";
import Timeline from "./Timeline";
import TitleLines from "./TitleLines";
import { isInternalPath } from "./UiLink";

const render = (element: ReactElement) => renderToStaticMarkup(element);
const count = (html: string, pattern: RegExp) =>
  [...html.matchAll(new RegExp(pattern.source, "g"))].length;
const root = fileURLToPath(new URL("../../../", import.meta.url));
const sourceFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const absolute = path.join(directory, entry);
    if (statSync(absolute).isDirectory()) return sourceFiles(absolute);
    return /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)
      ? [absolute]
      : [];
  });
/** Public site sources (no admin) whose text matches `pattern`. */
const publicSourcesMatching = (pattern: RegExp, except: string[] = []) =>
  [
    ...sourceFiles(path.join(root, "src/components")),
    ...sourceFiles(path.join(root, "src/app")),
  ]
    .map((file) => path.relative(root, file).split(path.sep).join("/"))
    .filter((file) => !file.includes("/admin/") && !except.includes(file))
    .filter((file) =>
      pattern.test(readFileSync(path.join(root, file), "utf8")),
    );
const textOf = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&#x27;", "'");

test("cx joins truthy classes and isInternalPath rejects protocol-relative URLs", () => {
  assert.equal(cx("a", false, null, undefined, "", "b"), "a b");
  assert.equal(isInternalPath("/istanbul/ilceler"), true);
  assert.equal(isInternalPath("//evil.example"), false);
  assert.equal(isInternalPath("/\\evil.example"), false);
  assert.equal(isInternalPath("#kaynak-3"), false);
  assert.equal(isInternalPath("https://www.sabandurali.com"), false);
  assert.equal(isInternalPath("mailto:saban@sabandurali.com"), false);
});

test("SkipLink is a hidden-until-focused link to the main content", () => {
  const html = render(h(SkipLink, null, "İçeriğe geç"));
  assert.match(html, /^<a href="#main"/);
  assert.match(html, /class="sr-only focus:not-sr-only/);
  assert.equal(textOf(html), "İçeriğe geç");
});

test("SectionSign reads as a numbered section, not as 01/12", () => {
  const html = render(
    h(SectionSign, { number: 1, total: 12, label: "Bir bakışta" }),
  );
  assert.match(
    html,
    /<span aria-hidden="true">01<span[^>]*>\/12<\/span><\/span>/,
  );
  assert.match(html, /<span class="sr-only">Bölüm 1, 12 bölümden: <\/span>/);
  assert.match(html, /^<p /);
  const heading = render(
    h(SectionSign, {
      number: 12,
      total: 12,
      label: "Son",
      as: "h2",
      end: true,
      locale: "en",
    }),
  );
  assert.match(heading, /^<h2 /);
  assert.match(heading, /Section 12 of 12: /);
  assert.match(heading, /<rect /);
});

test("Card has one title link with an expanded hit area; credits stay clickable", () => {
  const html = render(
    h(
      Card,
      {
        title: "Esenler",
        href: "/istanbul/ilceler/esenler",
        media: h("img", { src: "/x.jpg", alt: "Dörtyol Meydanı" }),
        credit: h(Credit, {
          credit: {
            author: "Mereyü",
            date: "23.09.2021",
            licence: "CC BY-SA 4.0",
            licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
          },
        }),
        eyebrow: h(GridRef, { value: "F2" }),
        cta: "Detaylı rehber",
      },
      h("p", null, "Nüfus 419.878 (2025)"),
    ),
  );
  assert.equal(count(html, /<a /), 2);
  assert.match(
    html,
    /<h3 class="m-0 type-card-title"><a [^>]*href="\/istanbul\/ilceler\/esenler"[^>]*>Esenler<\/a><\/h3>/,
  );
  assert.match(html, /data-card-link=""[^>]*after:absolute after:inset-0/);
  assert.match(html, /has-\[\[data-card-link\]:focus-visible\]:focus-ring/);
  // The ring is drawn around the card, so the title link drops its own
  // outline and halo (shadow-none would compose the halo back in).
  assert.match(
    html,
    /data-card-link=""[^>]*focus-visible:outline-none focus-visible:\[box-shadow:none\]/,
  );
  assert.match(
    html,
    /<a href="https:\/\/creativecommons\.org[^"]*" rel="license noopener noreferrer" class="relative z-10/,
  );
  assert.match(
    html,
    /<span aria-hidden="true" class="mt-auto[^"]*">Detaylı rehber<\/span>/,
  );
  assert.match(textOf(html), /Fotoğraf: Mereyü · 23\.09\.2021 · CC BY-SA 4\.0/);
});

test("Figure requires an explicit credit decision and renders licence and source", () => {
  const html = render(
    h(Figure, {
      caption: "Kadıköy Kurbağalıdere, 1904",
      credit: {
        collection: "Seyhun Binzet Koleksiyonu",
        date: "1904",
        licence: "Kamu malı",
        sourceUrl: "https://commons.wikimedia.org/",
        sourceLabel: "Wikimedia Commons",
      },
      children: h("img", { src: "/k.jpg", alt: "" }),
    }),
  );
  assert.match(html, /<figure class="m-0">/);
  assert.match(
    textOf(html),
    /Seyhun Binzet Koleksiyonu · 1904 · Kamu malı · Wikimedia Commons/,
  );
  const bare = render(
    h(Figure, {
      credit: null,
      children: h("img", { src: "/o.jpg", alt: "" }),
    }),
  );
  assert.doesNotMatch(bare, /figcaption/);
});

test("GridRef and LineChip are two distinct shapes", () => {
  const grid = render(h(GridRef, { value: "F2" }));
  assert.match(grid, /<span class="sr-only">Harita karesi <\/span>F2/);
  assert.doesNotMatch(
    render(h(GridRef, { value: "F2", announce: false })),
    /sr-only/,
  );

  const line = render(h(LineChip, { code: "M1B" }));
  assert.match(line, /rounded-chip/);
  assert.match(line, /bg-sea text-on-sea/);
  assert.equal(textOf(line), "M1B hattı");
  assert.match(
    render(h(LineChip, { code: "M3", variant: "other" })),
    /border-ink-muted/,
  );
});

test("SourceRef is a bracketed citation link with a spoken name", () => {
  assert.equal(formatSourceCode(3), "[3]");
  assert.equal(sourceAnchorId(3), "kaynak-3");
  const html = render(h(SourceRef, { number: 3 }));
  assert.match(html, /^<a href="#kaynak-3"/);
  assert.match(html, /min-h-tap min-w-tap/);
  assert.match(html, /\btext-ink\b/);
  assert.match(
    html,
    /<span aria-hidden="true">\[3\]<\/span><span class="sr-only">Kaynak 3<\/span>/,
  );
  // Ink on sea is 1:1: on a sea ground the reference turns white.
  const onSea = render(h(SourceRef, { number: 3, tone: "on-sea" }));
  assert.match(onSea, /\btext-on-sea\b/);
  assert.doesNotMatch(onSea, /\btext-ink\b/);
  const list = render(
    h(SourceRefList, { numbers: [1, 2], tone: "on-sea", locale: "en" }),
  );
  assert.match(list, /text-on-sea-muted/);
  assert.doesNotMatch(list, /\btext-ink(?:-muted)?\b/);
  assert.equal(count(list, /text-on-sea"/), 2, "both links turn white");
  assert.match(textOf(list), /Related sources/);
});

test("FactTable is a description list with dated, sourced values", () => {
  const html = render(
    h(FactTable, {
      facts: [
        {
          id: "nufus",
          label: "Nüfus",
          value: "419.878",
          unit: "kişi",
          date: "2025",
          sources: [3],
        },
        { id: "yaka", label: "Yaka", value: "Avrupa Yakası", kind: "text" },
      ],
      caption: "Nüfus veri yılı: 2025.",
    }),
  );
  assert.equal(count(html, /<dt/), 2);
  assert.equal(count(html, /<dd/), 6);
  assert.match(
    html,
    /<span class="type-data-lg whitespace-nowrap">419\.878<\/span>/,
  );
  assert.match(
    html,
    /Veri tarihi: <\/span><span class="type-data-md">2025<\/span>/,
  );
  assert.match(
    html,
    /<dd class="m-0 hidden @2xl:block">/,
    "an empty date only shows in the grid",
  );
  assert.match(html, /<span class="sr-only">yok<\/span>/);
  assert.match(html, /href="#kaynak-3"/);
  assert.match(html, /<div aria-hidden="true" class="hidden/);
});

test("Breadcrumb marks the current page and hides separators", () => {
  const html = render(
    h(Breadcrumb, {
      items: [
        homeBreadcrumbItem("tr"),
        { label: "İlçeler", href: "/istanbul/ilceler" },
        { label: "Esenler" },
      ],
    }),
  );
  assert.match(html, /^<nav aria-label="Konum">/);
  assert.equal(count(html, /<a /), 2);
  assert.match(
    html,
    /<span aria-current="page" class="text-ink font-bold">Esenler<\/span>/,
  );
  assert.equal(count(html, /<span aria-hidden="true">\/<\/span>/), 2);
});

test("FRONTEND-6: every breadcrumb starts with the same home crumb", () => {
  assert.deepEqual(homeBreadcrumbItem("tr"), { label: "Ana sayfa", href: "/" });
  assert.deepEqual(homeBreadcrumbItem("en"), { label: "Home", href: "/en" });

  // No page writes its own home crumb: the label comes from homeBreadcrumbItem().
  assert.deepEqual(
    publicSourcesMatching(/label:\s*"(?:Ana [Ss]ayfa|Home)",\s*href:/),
    [],
  );
});

test("Disclosure: the panel follows its button and exists while closed", () => {
  const html = render(
    h(Disclosure, {
      summary: "Ayrıntılar",
      id: "d1",
      children: h("p", null, "İçerik"),
    }),
  );
  assert.match(
    html,
    /<button id="d1-button" type="button" aria-expanded="false" aria-controls="d1-panel"[^>]*>.*<\/button><div id="d1-panel" hidden="">/,
  );
  const open = render(
    h(Disclosure, {
      summary: "Ayrıntılar",
      id: "d2",
      defaultOpen: true,
      headingLevel: 3,
      children: "x",
    }),
  );
  assert.match(
    open,
    /<h3 class="m-0 type-h4"><button[^>]*aria-expanded="true"/,
  );
  assert.match(open, /<div id="d2-panel">x<\/div>/);
});

test("NavMenu (FE-5): every panel is in the DOM right after its button", () => {
  const html = render(
    h(NavMenu, {
      label: "Ana navigasyon",
      items: [
        { id: "home", label: "Ana Sayfa", href: "/", current: true },
        {
          id: "istanbul",
          label: "Gayrimenkul & İstanbul",
          href: "/gayrimenkul-ve-istanbul",
          children: [
            { id: "ilceler", label: "İlçeler", href: "/istanbul/ilceler" },
            {
              id: "avrupa",
              label: "Avrupa Yakası",
              children: [
                {
                  id: "esenler",
                  label: "Esenler",
                  href: "/istanbul/ilceler/esenler",
                },
              ],
            },
          ],
        },
        { id: "iletisim", label: "İletişim", href: "/iletisim" },
      ],
    }),
  );
  assert.match(html, /^<nav aria-label="Ana navigasyon">/);
  assert.match(html, /<a [^>]*aria-current="page"[^>]*>Ana Sayfa<\/a>/);
  const controls = /aria-controls="([^"]+)"/.exec(html)?.[1];
  assert.ok(controls);
  assert.match(html, /<button type="button" aria-expanded="false"/);
  assert.ok(
    html.includes(`</button><div id="${controls}" hidden=""`),
    "panel must directly follow its button and stay in the DOM",
  );
  assert.equal(count(html, /<button /), 1, "links never become buttons");
  assert.match(html, /Gayrimenkul &amp; İstanbul: tümü/);
  const groupId = /<p id="([^"]+)" class="m-0 mb-1/.exec(html)?.[1];
  assert.ok(groupId);
  assert.match(html, new RegExp(`<ul aria-labelledby="${groupId}"`));
  assert.doesNotMatch(html, /role="menu/);
});

test("Field ties label, hint and error to the control (FE-21)", () => {
  assert.equal(describedBy("h", "e"), "h e");
  assert.equal(describedBy(undefined, undefined), undefined);
  const html = render(
    h(Field, {
      label: "E-posta",
      hint: "Yanıt bu adrese gelir.",
      error: "Geçerli bir e-posta yazın.",
      required: true,
      id: "email",
      children: (control: FieldControlProps) =>
        h(Input, { type: "email", name: "email", ...control }),
    }),
  );
  assert.match(
    html,
    /<label for="email"[^>]*>E-posta<span[^>]*>\(zorunlu\)<\/span><\/label>/,
  );
  assert.match(
    html,
    /<input[^>]*aria-describedby="email-hint email-error"[^>]*aria-invalid="true"[^>]*required=""/,
  );
  assert.match(html, /<p id="email-hint"/);
  assert.match(
    html,
    /<p id="email-error"[^>]*>.*<span class="sr-only">Hata: <\/span>Geçerli bir e-posta yazın\./,
  );
  const valid = render(
    h(Field, {
      label: "Ad",
      id: "name",
      children: (control: FieldControlProps) => h(Input, control),
    }),
  );
  assert.doesNotMatch(valid, / aria-invalid="| aria-describedby="|zorunlu/);
});

test("FRONTEND-7: Select shares the control states; no copied select styles", () => {
  const html = render(
    h(Field, {
      label: "Konu",
      error: "Bir konu seçin.",
      id: "subject",
      children: (control: FieldControlProps) =>
        h(Select, { name: "subject", ...control }, h("option", null, "A")),
    }),
  );
  assert.match(html, /<select [^>]*aria-invalid="true"/);
  assert.match(html, /aria-invalid:border-danger/);
  assert.match(html, /min-h-12/);
  // Every public select goes through the primitive.
  assert.deepEqual(
    publicSourcesMatching(/<select\b|selectClassName/, [
      "src/components/ui/Field.tsx",
    ]),
    [],
  );
});

test("FRONTEND-7: cards share one shell and hover only to palette tokens", () => {
  assert.deepEqual(publicSourcesMatching(/\bhover:bg-white\b/), []);
  // The title link and cue are written once, in Card.tsx.
  assert.deepEqual(publicSourcesMatching(/data-card-link=""/), [
    "src/components/ui/Card.tsx",
  ]);
  const card = render(
    h(Card, { title: "Esenler", href: "/x", cta: "Detaylı rehber" }),
  );
  assert.match(card, /<span aria-hidden="true" class="mt-auto type-small/);
  assert.match(
    render(h(EmptyState, null, "Henüz eklenmedi.")),
    /class="[^"]*type-body font-semibold/,
  );
});

test("FRONTEND-3: a card without href keeps the Card shell and is no link", () => {
  const linked = render(
    h(Card, { title: "Esenler", href: "/x", cta: "Detaylı rehber" }, "Özet"),
  );
  const unlinked = render(
    h(Card, { title: "Esenler", cta: "Detaylı rehber" }, "Özet"),
  );
  const frame = (html: string) => /^<article class="([^"]*)"/.exec(html)?.[1];

  assert.doesNotMatch(unlinked, /<a\b/);
  assert.match(unlinked, /<h3 class="m-0 type-card-title">Esenler<\/h3>/);
  // No "go" cue and no focus ring where nothing can be followed or focused.
  assert.doesNotMatch(unlinked, /Detaylı rehber/);
  assert.ok(!frame(unlinked)?.includes(cardFocusClassName));
  assert.ok(frame(linked)?.includes(cardFocusClassName));
  // The frame and the body are the linked card's.
  assert.equal(
    frame(unlinked),
    frame(linked)?.replace(` ${cardFocusClassName}`, ""),
  );
  assert.ok(frame(unlinked)?.startsWith(cardFrameClassName));
  assert.equal(
    /<div class="(flex flex-auto[^"]*)"/.exec(unlinked)?.[1],
    /<div class="(flex flex-auto[^"]*)"/.exec(linked)?.[1],
  );

  // No other component writes the card frame by hand.
  assert.deepEqual(
    publicSourcesMatching(/<article className="[^"]*rounded-card border/),
    [],
  );
});

test("FormStatus keeps both live regions mounted and only changes their text", () => {
  const idle = render(h(FormStatus, { state: "idle" }));
  assert.match(
    idle,
    /<div role="status" aria-live="polite" aria-atomic="true" tabindex="-1"[^>]*><\/div>/,
  );
  assert.match(
    idle,
    /<div role="alert" aria-atomic="true" tabindex="-1"[^>]*><\/div>/,
  );
  const error = render(
    h(FormStatus, { state: "error", message: "Gönderilemedi." }),
  );
  assert.match(error, /<div role="status"[^>]*><\/div>/);
  assert.match(
    error,
    /<div role="alert"[^>]*>.*Gönderilemedi\.<\/span><\/div>/,
  );
  const success = render(
    h(FormStatus, {
      state: "success",
      message: "Mesajınız alındı.",
      successActions: h(Button, null, "Yeni mesaj"),
    }),
  );
  assert.match(
    success,
    /<div role="status"[^>]*>.*Mesajınız alındı\.<\/span><\/div><div role="alert"[^>]*><\/div><div class="mt-3"><button/,
  );
  assert.doesNotMatch(success, /aria-busy/);
});

test("Button defaults to type=button; ButtonLink is a link", () => {
  assert.match(render(h(Button, null, "Gönder")), /^<button type="button"/);
  assert.match(
    render(h(Button, { type: "submit" }, "Gönder")),
    /^<button type="submit"/,
  );
  assert.match(
    render(h(ButtonLink, { href: "/iletisim", children: "İletişime geç" })),
    /^<a [^>]*href="\/iletisim"/,
  );
});

test("Pagination marks the current page and hides for a single page", () => {
  assert.equal(
    render(h(Pagination, { current: 1, total: 1, getHref: () => "/" })),
    "",
  );
  const html = render(
    h(Pagination, {
      current: 2,
      total: 5,
      getHref: (page: number) => `/makaleler?sayfa=${page}`,
    }),
  );
  assert.match(html, /^<nav aria-label="Sayfalar">/);
  assert.match(
    html,
    /aria-current="page"[^>]*><span class="sr-only">Sayfa 2<\/span>/,
  );
  assert.match(html, /rel="prev"/);
  assert.match(html, /rel="next"/);
});

test("FRONTEND-2: the previous and next links keep a 44 × 44 px target", () => {
  // Below sm their text is sr-only (absolute, no flex item), so without
  // min-w-tap the link is only the 18 px icon plus padding: 42 px wide.
  const html = render(
    h(Pagination, { current: 2, total: 3, getHref: () => "/" }),
  );
  for (const rel of ["prev", "next"]) {
    const link = new RegExp(`<a [^>]*rel="${rel}"[^>]*>`).exec(html);
    assert.ok(link, rel);
    const classes = /class="([^"]*)"/.exec(link[0])?.[1]?.split(/\s+/) ?? [];
    for (const name of ["min-h-tap", "min-w-tap", "justify-center"]) {
      assert.ok(classes.includes(name), `${rel}: ${name}`);
    }
  }
});

test("Timeline exposes order and notes as text", () => {
  const timeline = render(
    h(Timeline, {
      label: "Tarih çizelgesi",
      entries: [
        {
          id: "a",
          when: "27.12.1993",
          dateTime: "1993-12-27",
          children: "Kanun kabul edildi.",
          highlight: true,
          sources: [1],
        },
        { id: "b", when: "1994", children: "Belediye kuruldu." },
      ],
    }),
  );
  assert.match(timeline, /^<ol aria-label="Tarih çizelgesi"/);
  assert.match(timeline, /<time dateTime="1993-12-27"/);
  assert.match(timeline, /href="#kaynak-1"/);
  const seaTimeline = render(
    h(Timeline, {
      label: "Kariyer",
      tone: "sea",
      entries: [{ id: "a", when: "1996", children: "Başlangıç", sources: [2] }],
    }),
  );
  assert.match(
    seaTimeline,
    /<a href="#kaynak-2" class="[^"]*\btext-on-sea[ "]/,
    "source links stay readable on sea",
  );
});

test("FRONTEND-5: primitives draw fills from Atlas tokens, never raw white", () => {
  assert.deepEqual(publicSourcesMatching(/\bbg-white\b/), []);
});

test("FRONTEND-3: an accent title line is a signal fill, never an underline", () => {
  const html = render(
    h(
      "h1",
      null,
      h(TitleLines, {
        lines: [{ text: "İstanbul'u" }, { text: "okumak", accent: true }],
      }),
    ),
  );

  assert.equal(textOf(html), "İstanbul'u okumak");
  assert.match(
    html,
    /<span class="box-decoration-clone bg-signal px-\[0.12em\]">okumak<\/span>/,
  );
  assert.doesNotMatch(html, /underline/);
  // The home hero and the CMS hero block share the component.
  assert.deepEqual(
    publicSourcesMatching(/titleLines\.map\(/, [
      "src/components/ui/TitleLines.tsx",
    ]),
    [],
  );
});

test("ARCHITECTURE-3: one Eyebrow and one PageIntro, both primitives", () => {
  const html = render(
    h(PageIntro, {
      eyebrow: "İLETİŞİM",
      title: "İletişim",
      lead: "Giriş",
      breadcrumb: [homeBreadcrumbItem("tr"), { label: "İletişim" }],
    }),
  );
  assert.equal(count(html, /<h1\b/), 1);
  assert.match(html, /^<header class="flex flex-col gap-5">/);
  assert.match(html, /aria-current="page"/);
  assert.match(
    html,
    /<span aria-hidden="true" class="h-1 w-8 shrink-0 bg-signal"><\/span>/,
  );

  const page = render(
    h(PageIntro, { layout: "page", title: "Makaleler", titleLang: "tr" }),
  );
  assert.match(page, /^<header class="[^"]*pt-6 pb-10/);
  assert.match(page, /<h1 lang="tr" class="[^"]*hyphens-auto/);

  assert.deepEqual(
    publicSourcesMatching(/export (default )?function (Eyebrow|PageIntro)\b/),
    ["src/components/ui/Eyebrow.tsx", "src/components/ui/PageIntro.tsx"],
  );
  assert.equal(
    render(h(Eyebrow, { number: 2, children: "Bölüm" })).includes(">02<"),
    true,
  );
});

test("EmptyState states the gap in text", () => {
  const html = render(
    h(EmptyState, null, "Bu ilçeden seçilmiş fotoğraflar henüz eklenmedi."),
  );
  assert.match(html, /bg-hatch/);
  assert.match(textOf(html), /henüz eklenmedi\./);
});

test("DistrictTileMap: 39 named links per layout, featured and current states", () => {
  const html = render(h(DistrictTileMap, { featuredSlug: "esenler" }));
  // It draws its own light grounds, so it sets its own ink too.
  assert.match(html, /^<figure class="@container m-0 text-ink">/);
  const links = [
    ...html.matchAll(/<a [^>]*href="(\/istanbul\/ilceler\/[a-z]+)"/g),
  ].map((match) => match[1]);
  assert.equal(links.length, 78, "grid and phone layouts each link all 39");
  assert.equal(new Set(links).size, 39);
  assert.match(html, /<span class="sr-only">, öne çıkan rehber<\/span>/);
  assert.match(html, /Şematik, ölçeksiz/);
  assert.match(html, /Öne çıkan rehber: Esenler \(F2\)\./);
  assert.match(html, /grid-cols-subgrid/);
  // The full grid needs ~70 px tiles, so it depends on the map's own width
  // (container query, 72 rem), not on the viewport: 55 px tiles at 64 rem
  // break names mid-word, and a narrow column must get the compact atlas.
  assert.match(html, /^<figure class="@container /);
  assert.match(html, /<div class="hidden [^"]*@6xl:block">/);
  assert.match(html, /class="@6xl:hidden"/);
  assert.doesNotMatch(html, /(?:^|[\s"])(?:sm|md|lg|xl):/);
  const avrupaId = /<h3 id="([^"]+-avrupa)"/.exec(html)?.[1];
  assert.ok(avrupaId, "side headings carry unique ids");
  assert.match(html, new RegExp(`<ul aria-labelledby="${avrupaId}"`));
  assert.match(html, /<ul aria-labelledby="[^"]+-anadolu"/);
  assert.doesNotMatch(html, /overflow-x-auto/, "no sideways scrolling");
  assert.doesNotMatch(
    html,
    /<span>K<\/span>/,
    "the Bosphorus column has no letter",
  );
  assert.match(html, /Kuzey/);
  // FRONTEND-7: a hovered tile changes ground. The grid sits on paper and
  // tiles are land, so the hover ground is band, never paper (or white).
  const kadikoyTile = [...html.matchAll(/<a [^>]*>/g)]
    .map(([tag]) => tag)
    .find((tag) => tag.includes('href="/istanbul/ilceler/kadikoy"'));
  assert.ok(kadikoyTile);
  assert.match(kadikoyTile, /\bbg-land\b/);
  assert.match(kadikoyTile, /\bhover:bg-band\b/);
  assert.doesNotMatch(kadikoyTile, /\bhover:bg-(?:paper|white)\b/);
  assert.match(html, /Gazi\u00adosman\u00adpaşa/);

  const current = render(
    h(DistrictTileMap, { currentSlug: "kadikoy", locale: "en" }),
  );
  assert.equal(count(current, /<a [^>]*href="\/istanbul\/ilceler\//), 76);
  assert.equal(count(current, /<span aria-current="page"/), 2);
  assert.match(current, /EUROPEAN SIDE/);
});

test("DistrictKeyMap draws 39 squares and the band, decorative by default", () => {
  const html = render(
    h(DistrictKeyMap, {
      featuredSlug: "esenler",
      highlightSlugs: ["bagcilar"],
    }),
  );
  assert.match(
    html,
    /^<svg viewBox="0 0 150 50" focusable="false" aria-hidden="true"/,
  );
  assert.equal(count(html, /<rect /), 40);
  assert.equal(count(html, /fill-signal stroke-ink/), 1);
  assert.equal(count(html, /fill-sea-track/), 1);
  const titled = render(h(DistrictKeyMap, { title: "Esenler F2 karesinde" }));
  assert.match(titled, /role="img"/);
  assert.match(titled, /<title>Esenler F2 karesinde<\/title>/);
});

test("PlateTitle fits long district names: it passes the visible length to CSS", () => {
  assert.equal(plateCharacters("Esenler"), 7);
  assert.equal(plateCharacters("Gazi\u00adosman\u00adpaşa"), 13);
  assert.equal(plateCharacters("Şile"), 4);
  assert.equal(plateCharacters(""), 1);
  const html = render(
    h(PlateTitle, { id: "ilce-baslik", children: "Gazi\u00adosman\u00adpaşa" }),
  );
  assert.match(
    html,
    /^<div class="@container"><h1 id="ilce-baslik" class="m-0 type-plate" style="--plate-chars:13">/,
  );
  assert.match(
    render(h(PlateTitle, { as: "p", children: "Esenler" })),
    /<p class="m-0 type-plate"/,
  );
});

test("FormStatus moves focus only to a new result, never on first render", () => {
  assert.equal(
    resultFocusTarget("error", "error"),
    null,
    "initial error state",
  );
  assert.equal(resultFocusTarget("idle", "submitting"), null);
  assert.equal(resultFocusTarget("submitting", "success"), "status");
  assert.equal(resultFocusTarget("submitting", "error"), "alert");
  assert.equal(resultFocusTarget("error", "success"), "status");
  assert.equal(resultFocusTarget("success", "idle"), null);
  assert.equal(
    resultFocusTarget("submitting", "success", false),
    null,
    "an empty region never takes focus",
  );
  assert.equal(resultFocusTarget("submitting", "error", false), null);
});
