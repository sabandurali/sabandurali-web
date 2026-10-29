import assert from "node:assert/strict";
import test from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { homeContent } from "@/content/homeContent";
import type { PublicPage } from "@/content/pages/public-types";
import { getVerifiedDistrictImage } from "@/content/photos/verified-district-images";
import ContactCallToAction from "./ContactCallToAction";
import { FocusAreaCards } from "./FocusAreas";
import Hero from "./Hero";
import HomeAtlas, { getDistrictImageCredit } from "./HomeAtlas";
import HomeListingSection from "./HomeListingSection";
import { getPortraitCredit } from "./home-portrait";

// Components that render next/image (About, the featured card's photo and
// the collection cards) are checked in the built page; next/image does not
// load under tsx's ESM interop.

const count = (html: string, pattern: RegExp) =>
  [...html.matchAll(new RegExp(pattern.source, "g"))].length;

test("the hero is the page's only h1 and uses the display type", () => {
  const html = renderToStaticMarkup(
    h(Hero, {
      anchors: homeContent.tr.anchors,
      content: homeContent.tr.hero,
      factsLabel: "Platform özeti",
    }),
  );

  assert.equal(count(html, /<h1\b/), 1);
  assert.match(html, /<h1 id="ana-baslik" class="m-0 type-display">/);
  assert.match(html, /href="\/gayrimenkul-ve-istanbul"/);
  assert.match(html, /aria-label="Platform özeti"/);
  assert.match(html, /<dd[^>]*>39<\/dd>/);
  // FRONTEND-4: the panel label is Turkish on the Turkish page (WCAG 3.1.2).
  assert.match(html, /<p [^>]*>Platform özeti<\/p>/);
  assert.doesNotMatch(html, /Intelligence/);
  assert.doesNotMatch(html, /text-signal\b/, "no orange text on paper");
});

test("the English hero falls back to in-page anchors", () => {
  const html = renderToStaticMarkup(
    h(Hero, {
      anchors: homeContent.en.anchors,
      content: homeContent.en.hero,
      factsLabel: "Platform at a glance",
    }),
  );

  assert.match(html, /href="#work"/);
  assert.match(html, /href="#about"/);
});

test("without a published guide the atlas says so instead of featuring one", () => {
  const html = renderToStaticMarkup(
    h(HomeAtlas, { locale: "tr", featured: null }),
  );

  assert.match(html, /Öne çıkan ilçe rehberi henüz yayımlanmadı\./);
  assert.doesNotMatch(html, /Öne çıkan rehber:/);
  assert.ok(count(html, /href="\/istanbul\/ilceler\/[a-z]+"/) >= 39);
  assert.match(html, /aria-labelledby="istanbul-atlasi-baslik"/);
});

test("the English atlas features the guide, marks the Turkish summary and links in Turkish", () => {
  const html = renderToStaticMarkup(
    h(HomeAtlas, {
      locale: "en",
      featured: {
        slug: "esenler",
        summary: "Esenler, İstanbul’un Avrupa Yakası’nda bir ilçedir.",
        image: null,
      },
    }),
  );

  assert.match(html, /Featured guide: Esenler/);
  assert.match(html, /<h4[^>]*><a[^>]*href="\/istanbul\/ilceler\/esenler"/);
  assert.match(html, /<p lang="tr"[^>]*>Esenler, İstanbul/);
  assert.match(html, /District guides are published in Turkish\./);

  // COMPLETENESS-3: every link to a Turkish guide (the featured card, the
  // tile map and "all districts") names the target language.
  const guideLinks = [
    ...html.matchAll(/<a\b[^>]*href="\/istanbul\/ilceler[^"]*"[^>]*>/g),
  ].map(([tag]) => tag);
  assert.ok(guideLinks.length >= 40, `${guideLinks.length} guide links`);
  for (const tag of guideLinks) assert.match(tag, /hrefLang="tr"/i, tag);
  const featuredLink = /<h4[^>]*>(<a\b[^>]*>)/.exec(html)?.[1] ?? "";
  assert.match(featuredLink, /href="\/istanbul\/ilceler\/esenler"/);
  assert.match(featuredLink, /hrefLang="tr"/i);
});

test("the Turkish atlas does not mark its own-language links", () => {
  const html = renderToStaticMarkup(
    h(HomeAtlas, {
      locale: "tr",
      featured: { slug: "esenler", summary: "Esenler.", image: null },
    }),
  );
  assert.doesNotMatch(html, /hrefLang=/i);
});

test("CRT-5: the English district photo credit is the English one", () => {
  const image = getVerifiedDistrictImage("esenler", "en");
  assert.ok(image !== null);
  assert.match(image.alt, /^Dörtyol Square in Esenler/);

  const credit = getDistrictImageCredit(image, "en");
  assert.match(credit.collection ?? "", /Image cropped to fit/);
  assert.equal(credit.licence, "Licence");
  assert.equal(
    credit.licenceUrl,
    "https://creativecommons.org/licenses/by-sa/4.0/",
  );
  assert.match(credit.sourceUrl ?? "", /^https:\/\/commons\.wikimedia\.org\//);

  const turkish = getVerifiedDistrictImage("esenler", "tr");
  assert.ok(turkish !== null);
  assert.equal(getDistrictImageCredit(turkish, "tr").licence, "Lisans");
});

test("an empty listing shows the empty state and hides the list link", () => {
  const html = renderToStaticMarkup(
    h(HomeListingSection, {
      id: "son-makaleler",
      locale: "tr",
      number: "02",
      eyebrow: "Makaleler",
      title: "Güncel analizler",
      linkLabel: "Tüm makaleler",
      href: "/makaleler",
      emptyMessage: "Henüz yayımlanmış makale yok.",
      itemCount: 0,
      children: h("p", null, "liste"),
    }),
  );

  assert.match(html, /Henüz yayımlanmış makale yok\./);
  assert.doesNotMatch(html, /Tüm makaleler/);
  assert.doesNotMatch(html, /liste/);
  assert.match(html, /aria-labelledby="son-makaleler-baslik"/);
});

test("a filled listing shows its items and the list link", () => {
  const html = renderToStaticMarkup(
    h(HomeListingSection, {
      id: "kitaplar",
      locale: "tr",
      number: "03",
      eyebrow: "Kitaplar",
      title: "Bilgi Kütüphanesi",
      linkLabel: "Tüm kitaplar",
      href: "/kitaplar",
      emptyMessage: "Boş",
      itemCount: 1,
      children: h("p", null, "liste"),
    }),
  );

  assert.match(html, /href="\/kitaplar"/);
  assert.match(html, /<p>liste<\/p>/);
  assert.doesNotMatch(html, /Boş/);
});

function homeWithPortrait(credit: string | undefined): PublicPage {
  return {
    id: "1",
    title: "Ana sayfa",
    slug: "ana-sayfa",
    language: "tr",
    pageType: "home",
    summary: "",
    publishedAt: "2026-10-01T00:00:00.000Z",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    seo: {
      title: "t",
      description: "d",
      index: true,
      follow: true,
      socialImage: null,
    },
    layout: [
      {
        id: "a",
        visible: true,
        anchor: null,
        blockType: "homeAbout",
        eyebrow: "Hakkımda",
        titleLines: ["Şaban Durali"],
        paragraphs: ["Metin."],
        link: null,
        imageAlt: "Portre",
        image: {
          src: "/api/media/file/portre.jpg",
          alt: "Portre",
          ...(credit === undefined ? {} : { credit }),
        },
      },
    ],
  };
}

test("CRT-2: the CMS portrait shows its media credit; the built-in one none", () => {
  const about = {
    ...homeContent.tr.about,
    imageSrc: "/api/media/file/portre.jpg",
  };

  assert.deepEqual(
    getPortraitCredit(homeWithPortrait("Foto: Ayşe Ö."), about),
    { collection: "Foto: Ayşe Ö." },
  );
  assert.equal(getPortraitCredit(homeWithPortrait(undefined), about), null);
  assert.equal(getPortraitCredit(homeWithPortrait("   "), about), null);
  assert.equal(getPortraitCredit(null, homeContent.tr.about), null);
  assert.equal(
    getPortraitCredit(homeWithPortrait("x"), homeContent.tr.about),
    null,
  );
});

test("focus-area cards: one link per linked card, plain text otherwise", () => {
  const html = renderToStaticMarkup(
    h(FocusAreaCards, {
      cards: [
        {
          id: "1",
          icon: "city",
          title: "Gayrimenkul",
          description: "Rehberler.",
          linkLabel: "Alanı aç",
          linkHref: "/gayrimenkul-ve-istanbul",
        },
        {
          id: "2",
          icon: "book",
          title: "Kitaplar",
          description: "Notlar.",
          linkLabel: "Alanı aç",
          linkHref: null,
        },
      ],
    }),
  );

  assert.equal(count(html, /<a\b/), 1);
  assert.equal(count(html, /<h3\b/), 2);
  assert.equal(count(html, /Alanı aç/), 1);
  assert.match(html, /aria-hidden="true"[^>]*>Alanı aç/);
});

test("the contact call to action links to the contact page", () => {
  const html = renderToStaticMarkup(
    h(ContactCallToAction, {
      content: homeContent.tr.contactCallToAction,
      href: "/iletisim",
    }),
  );

  assert.match(html, /<h2 id="iletisim-cagri-baslik"/);
  assert.match(html, /href="\/iletisim"/);
});
