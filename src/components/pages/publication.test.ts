import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getArticleMetaItems } from "../articles/article-meta";
import { getBookReviewCardFacts } from "../books/BookReviewCard";
import { getBookMetadataItems } from "../books/BookMetadata";
import {
  getPhotoCredit,
  getPhotoExif,
  getPhotoFacts,
} from "../photos/photo-details";
import { getPhotoListHref } from "../photos/photo-list-params";
import { exampleEnglishArticle } from "../../content/articles/examples";
import { mapStaticArticle } from "../../content/articles/static-articles";
import { bookPageContent } from "../../content/books/book-page-content";
import {
  exampleEnglishBookReview,
  exampleTurkishBookReview,
} from "../../content/books/examples";
import type { PublicPageBlock } from "../../content/pages/public-types";
import type { PublicPhoto } from "../../content/photos/types";
import MetaList from "./MetaList";
import { getVisibleBlocks, opensWithHero } from "./PageBlocks";
import PageIntro from "@/components/ui/PageIntro";
import {
  altLanguageAttribute,
  creditFromImage,
  creditFromText,
} from "./publication-media";
import { publicationCopy } from "./publication-copy";

const photo: PublicPhoto = {
  id: "photo-1",
  language: "tr",
  title: "Kuzguncuk sabahı",
  slug: "kuzguncuk-sabahi",
  description: null,
  image: { src: "/api/media/file/x.jpg", alt: "Kıyıda tekneler" },
  collections: [],
  tags: [],
  takenAt: "2026-03-01T22:30:00.000Z",
  locationName: "Kuzguncuk, Üsküdar",
  district: null,
  neighborhood: null,
  districtPhotoCategory: null,
  dayPeriod: null,
  photographer: "Şaban Durali",
  creditLicense: "CC BY 4.0",
  exif: {
    camera: "X100V",
    lens: null,
    focalLength: "23 mm",
    aperture: null,
    shutterSpeed: null,
    iso: "400",
  },
  featured: false,
  publishedAt: "2026-03-02T09:00:00.000Z",
  createdAt: "2026-03-02T09:00:00.000Z",
  updatedAt: "2026-03-02T09:00:00.000Z",
  seo: { title: "", description: "", openGraphImage: null },
};

test("credits keep the editor's line and drop empty ones", () => {
  assert.deepEqual(creditFromText("  Arşiv · CC BY  "), {
    collection: "Arşiv · CC BY",
  });
  assert.equal(creditFromText("   "), null);
  assert.equal(creditFromText(undefined), null);
  assert.deepEqual(
    creditFromImage({ copyrightOwner: "SALT Araştırma", license: "CC BY-NC" }),
    { collection: "SALT Araştırma · CC BY-NC" },
  );
  assert.equal(creditFromImage({}), null);
});

test("an alt text in another language than the page gets lang (WCAG 3.1.2)", () => {
  assert.deepEqual(altLanguageAttribute("tr", "en"), { lang: "tr" });
  assert.deepEqual(altLanguageAttribute("en", "en"), {});
  assert.deepEqual(altLanguageAttribute(undefined, "en"), {});
});

test("article meta: Istanbul dates with machine values, update only when different", () => {
  const article = mapStaticArticle({
    ...exampleEnglishArticle,
    publishedAt: "2026-01-14T22:30:00.000Z",
    updatedAt: "2026-01-14T23:00:00.000Z",
  });
  const items = getArticleMetaItems(article);

  // 22:30 UTC is already 15 January in Istanbul.
  assert.equal(items[0]?.value, "15 January 2026");
  assert.equal(items[0]?.dateTime, "2026-01-14T22:30:00.000Z");
  assert.equal(
    items.some((item) => item.label === "Updated"),
    false,
  );

  const updated = getArticleMetaItems(
    mapStaticArticle({
      ...exampleEnglishArticle,
      publishedAt: "2026-01-10T09:00:00.000Z",
      updatedAt: "2026-02-01T09:00:00.000Z",
    }),
  );
  assert.equal(
    updated.find((item) => item.label === "Updated")?.value,
    "1 February 2026",
  );
});

test("book facts leave out empty values and mark data", () => {
  const items = getBookMetadataItems(
    {
      ...exampleTurkishBookReview,
      isbn13: "9786051111111",
      publisher: "  ",
      pageCount: 320,
    },
    bookPageContent.tr,
  );
  const labels = items.map((item) => item.label);

  assert.ok(labels.includes("ISBN-13"));
  assert.ok(!labels.includes("Yayınevi"));
  assert.equal(items.find((item) => item.label === "Sayfa sayısı")?.data, true);
  assert.equal(
    items.find((item) => item.label === "Orijinal kitap adı")?.value,
    "Ultralearning",
  );
});

test("book card facts show status, rating and review date", () => {
  const facts = getBookReviewCardFacts(
    {
      ...exampleEnglishBookReview,
      rating: 8,
      publishedAt: "2026-05-31T21:30:00.000Z",
    },
    bookPageContent.en,
  );

  assert.deepEqual(
    facts.map((fact) => [fact.label, fact.value]),
    [
      [
        "Reading status",
        bookPageContent.en.readingStatusLabels[
          exampleEnglishBookReview.readingStatus
        ],
      ],
      ["Rating", "8 / 10"],
      ["Review date", "1 June 2026"],
    ],
  );
});

test("photo credit, facts and EXIF", () => {
  assert.deepEqual(getPhotoCredit(photo), {
    author: "Şaban Durali",
    licence: "CC BY 4.0",
  });
  assert.deepEqual(getPhotoCredit({ ...photo, creditLicense: null }), {
    author: "Şaban Durali",
  });

  const facts = getPhotoFacts(photo);
  assert.deepEqual(
    facts.map((fact) => fact.label),
    ["Konum", "Çekim tarihi", "Fotoğrafçı", "Kredi / lisans"],
  );
  // Formatted in Europe/Istanbul: 22:30 UTC on 1 March is 2 March there.
  assert.equal(facts[1]?.value, "2 Mart 2026");

  assert.deepEqual(
    getPhotoExif(photo).map((item) => [item.label, item.value]),
    [
      ["Kamera", "X100V"],
      ["Odak uzaklığı", "23 mm"],
      ["ISO", "400"],
    ],
  );
});

test("photo list links keep the filters and drop page 1", () => {
  assert.equal(getPhotoListHref("tr", {}, 1), "/fotograflar");
  assert.equal(
    getPhotoListHref("en", { collection: "city", tag: "cats" }, 3),
    "/en/photography?collection=city&tag=cats&page=3",
  );
});

test("a standard page opens with its hero only when the hero comes first", () => {
  const base = { visible: true, anchor: null };
  const hero = {
    ...base,
    id: "h",
    blockType: "hero",
    eyebrow: null,
    titleLines: [{ text: "Başlık", accent: false }],
    description: "",
    primaryAction: { label: "A", href: "/a" },
    secondaryAction: { label: "B", href: "/b" },
    highlights: [],
  } satisfies PublicPageBlock;
  const cta = {
    ...base,
    id: "c",
    blockType: "cta",
    title: "İletişim",
    description: null,
    action: { label: "Yaz", href: "/iletisim" },
  } satisfies PublicPageBlock;

  assert.equal(opensWithHero([hero, cta]), true);
  assert.equal(opensWithHero([{ ...hero, visible: false }, cta]), false);
  assert.equal(opensWithHero([cta, hero]), false);
  assert.deepEqual(
    getVisibleBlocks([{ ...cta, visible: false }, hero]).map((b) => b.id),
    ["h"],
  );
});

test("PageIntro renders one h1, the breadcrumb and the lead", () => {
  const html = renderToStaticMarkup(
    createElement(PageIntro, {
      layout: "page",
      locale: "tr",
      breadcrumb: [{ label: "Ana sayfa", href: "/" }, { label: "Makaleler" }],
      eyebrow: "YAYINLAR",
      title: "Makaleler",
      titleId: "page-title",
      lead: "Giriş paragrafı",
    }),
  );

  assert.equal(html.match(/<h1/g)?.length, 1);
  assert.match(html, /<h1 id="page-title"/);
  assert.match(html, /aria-current="page"/);
  assert.match(html, /Giriş paragrafı/);
});

test("MetaList puts dates in <time> and skips an empty list", () => {
  const html = renderToStaticMarkup(
    createElement(MetaList, {
      items: [
        {
          label: "Yayınlandı",
          value: "15 Ocak 2026",
          dateTime: "2026-01-14T22:30:00.000Z",
          data: true,
        },
      ],
    }),
  );
  assert.match(
    html,
    /<dt[^>]*>Yayınlandı<\/dt><dd[^>]*><time dateTime="2026-01-14T22:30:00.000Z">15 Ocak 2026<\/time><\/dd>/,
  );
  assert.equal(
    renderToStaticMarkup(createElement(MetaList, { items: [] })),
    "",
  );
});

test("English counts are plural-aware, Turkish ones are not", () => {
  assert.equal(publicationCopy.en.articleCount(1), "1 article");
  assert.equal(publicationCopy.en.photoCount(2), "2 photographs");
  assert.equal(publicationCopy.tr.bookCount(3), "3 kitap incelemesi");
});

test("static article tables are named regions and source marks are underlined links", async () => {
  const { default: ArticleContent } =
    await import("../articles/ArticleContent");
  const { articlePageContent } =
    await import("../../content/articles/article-page-content");
  const sourceId = exampleEnglishArticle.sources[0]?.id ?? "";
  const article = mapStaticArticle({
    ...exampleEnglishArticle,
    content: [
      {
        id: "table-1",
        type: "table",
        headers: ["District", "Value"],
        rows: [["Kadıköy", "1"]],
      },
      {
        id: "stat-1",
        type: "statistic",
        value: "39",
        label: "districts",
        sourceId,
      },
    ],
  });
  const html = renderToStaticMarkup(
    createElement(ArticleContent, {
      article,
      content: articlePageContent.en,
    }),
  );

  // A caption-less table still gets a name for its focusable scroll region.
  assert.match(html, /role="region" aria-label="Table" tabindex="0"/);
  // The [1] source mark is not told apart by colour alone (WCAG 1.4.1).
  assert.match(
    html,
    /<a href="#source-[^"]+" class="[^"]*\bunderline\b[^"]*">\[1\]<\/a>/,
  );
});
