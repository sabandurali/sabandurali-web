import assert from "node:assert/strict";
import test from "node:test";
import { createElement as h, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Breadcrumb from "./Breadcrumb";
import { Button, ButtonLink } from "./Button";
import Card from "./Card";
import { cx } from "./cx";
import Disclosure from "./Disclosure";
import DistrictKeyMap from "./DistrictKeyMap";
import DistrictTileMap from "./DistrictTileMap";
import EmptyState from "./EmptyState";
import FactTable from "./FactTable";
import { Field, Input, describedBy, type FieldControlProps } from "./Field";
import { Credit, Figure } from "./Figure";
import FormStatus, { resultFocusTarget } from "./FormStatus";
import GridRef from "./GridRef";
import { LineChip, StationMarker } from "./LineChip";
import NavMenu from "./NavMenu";
import Pagination from "./Pagination";
import PlateTitle, { plateCharacters } from "./PlateTitle";
import SectionSign from "./SectionSign";
import SkipLink from "./SkipLink";
import { SourceRef, formatSourceCode, sourceAnchorId } from "./SourceRef";
import StationDiagram from "./StationDiagram";
import Timeline from "./Timeline";
import { isInternalPath } from "./UiLink";

const render = (element: ReactElement) => renderToStaticMarkup(element);
const count = (html: string, pattern: RegExp) =>
  [...html.matchAll(new RegExp(pattern.source, "g"))].length;
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

test("GridRef, LineChip and StationMarker are three distinct shapes", () => {
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

  const station = render(h(StationMarker, { name: "Davutpaşa–YTÜ" }));
  assert.doesNotMatch(station, /rounded-chip/);
  assert.match(
    station,
    /<span aria-hidden="true" class="size-4 shrink-0 rounded-full/,
  );
  assert.equal(textOf(station), "Davutpaşa–YTÜ");
});

test("SourceRef is a bracketed citation link with a spoken name", () => {
  assert.equal(formatSourceCode(3), "[3]");
  assert.equal(sourceAnchorId(3), "kaynak-3");
  const html = render(h(SourceRef, { number: 3 }));
  assert.match(html, /^<a href="#kaynak-3"/);
  assert.match(html, /min-h-tap min-w-tap/);
  assert.match(
    html,
    /<span aria-hidden="true">\[3\]<\/span><span class="sr-only">Kaynak 3<\/span>/,
  );
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
        { label: "Ana Sayfa", href: "/" },
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

test("Timeline and StationDiagram expose order and notes as text", () => {
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

  const diagram = render(
    h(StationDiagram, {
      code: "M7",
      name: "Yıldız–Mahmutbey",
      label: "M7, metinde adı geçen istasyonlar",
      stations: [
        { name: "Mahmutbey", note: "hat ucu" },
        { name: "Giyimkent–Tekstilkent", note: "kuzey kesim", serves: true },
      ],
    }),
  );
  assert.match(diagram, /<ol aria-label="M7, metinde adı geçen istasyonlar"/);
  assert.match(diagram, /Giyimkent–<wbr\/>Tekstilkent/);
  assert.match(textOf(diagram), /Mahmutbeyhat ucu/);
  assert.match(diagram, /border-dotted/);
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
});
