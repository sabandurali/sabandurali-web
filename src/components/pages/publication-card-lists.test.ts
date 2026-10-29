/**
 * FRONTEND-2: the home page and the workspace section pages show articles,
 * book reviews and photos with the list pages' cards, so image checks,
 * alt-text `lang`, credits and date styles cannot drift between copies.
 *
 * next/image does not render under tsx, so the element trees are inspected
 * without rendering: the lists are walked for the card components they use
 * and the article card is called directly.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { isValidElement, type ReactElement } from "react";
import ArticleCard from "@/components/articles/ArticleCard";
import BookReviewCard from "@/components/books/BookReviewCard";
import PhotoCard from "@/components/photos/PhotoCard";
import { Credit } from "@/components/ui/Figure";
import { articlePageContent } from "@/content/articles/article-page-content";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import { bookPageContent } from "@/content/books/book-page-content";
import { exampleEnglishBookReview } from "@/content/books/examples";
import { toPublicBookReview } from "@/content/books/public-types";
import type { PublicPhoto } from "@/content/photos/types";
import { cardGrids } from "./card-grid";
import { PublicationImage } from "./publication-media";
import {
  ArticleCardList,
  BookReviewCardList,
  PhotoCardList,
} from "./PublicationCardLists";

const stamp = "2026-10-01T09:00:00.000Z";

function article(language: "tr" | "en"): PublicArticleSummary {
  return {
    id: `a-${language}`,
    title: "Başlık",
    slug: "baslik",
    language,
    translationKey: null,
    summary: "Özet",
    categories: [],
    featuredImage: {
      source: "payload",
      src: "/api/media/file/kapak.jpg",
      alt: "Boğaz kıyısında bir yalı",
      altLanguage: "tr",
      credit: "Kaynak: Arşiv",
    },
    featured: false,
    articleType: "article",
    district: null,
    districtNeighborhood: null,
    newsCategory: null,
    externalSource: null,
    publishedAt: stamp,
    createdAt: stamp,
    updatedAt: stamp,
    seo: { title: "Başlık", description: "", index: true, follow: true },
  };
}

function photo(): PublicPhoto {
  return {
    id: "p1",
    language: "tr",
    title: "Galata",
    slug: "galata",
    description: null,
    image: { src: "/media/galata.jpg", alt: "Galata Kulesi" },
    collections: [],
    tags: [],
    takenAt: null,
    locationName: null,
    district: null,
    neighborhood: null,
    districtPhotoCategory: null,
    dayPeriod: null,
    photographer: "Şaban Durali",
    creditLicense: null,
    exif: {
      camera: null,
      lens: null,
      focalLength: null,
      aperture: null,
      shutterSpeed: null,
      iso: null,
    },
    featured: false,
    publishedAt: stamp,
    createdAt: stamp,
    updatedAt: stamp,
    seo: { title: "Galata", description: "", openGraphImage: null },
  };
}

/** Every element in a tree, without rendering function components. */
function elements(node: unknown): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...elements(node.props.children)];
}

function ofType(node: unknown, type: unknown) {
  return elements(node).filter((element) => element.type === type);
}

test("article lists use the canonical card with the page's content", () => {
  const list = ArticleCardList({ articles: [article("en")], locale: "en" });
  const cards = ofType(list, ArticleCard);

  assert.equal(cards.length, 1);
  assert.equal(cards[0]?.props.content, articlePageContent.en);
  assert.equal(cards[0]?.props.headingLevel, "h3");
});

test("a Turkish alt text on an English article card carries lang=tr", () => {
  const card = ArticleCard({
    article: article("en"),
    content: articlePageContent.en,
    headingLevel: "h3",
  });
  const media = card.props.media;

  assert.ok(isValidElement<Record<string, unknown>>(media));
  assert.equal(media.type, PublicationImage);
  assert.equal(media.props.lang, "tr");
  assert.ok(isValidElement(card.props.credit));
  assert.equal(card.props.credit.type, Credit);
});

test("book and photo lists use the canonical cards", () => {
  const books = BookReviewCardList({
    books: [toPublicBookReview(exampleEnglishBookReview)],
    locale: "en",
  });
  const bookCards = ofType(books, BookReviewCard);
  assert.equal(bookCards.length, 1);
  assert.equal(bookCards[0]?.props.content, bookPageContent.en);
  assert.equal(bookCards[0]?.props.headingLevel, "h3");

  const photos = PhotoCardList({ photos: [photo()], columns: 4 });
  const photoCards = ofType(photos, PhotoCard);
  assert.equal(photoCards.length, 1);
  assert.equal(photoCards[0]?.props.headingLevel, "h3");
  assert.match(String(photos.props.className), /xl:grid-cols-4/);
});

const breakpoints: Record<string, number> = { sm: 640, md: 768, xl: 1280 };

/** The min-width breakpoints where a grid class changes the column count. */
function gridBreakpoints(className: string): number[] {
  return [...className.matchAll(/\b(sm|md|lg|xl):grid-cols-\d/g)]
    .map((match) => breakpoints[match[1] ?? ""] ?? Number.NaN)
    .sort((a, b) => a - b);
}

/** The min-width conditions of a `sizes` attribute, ascending. */
function sizesBreakpoints(sizes: string): number[] {
  return [...sizes.matchAll(/\(min-width: (\d+)px\)/g)]
    .map((match) => Number(match[1]))
    .sort((a, b) => a - b);
}

test("SEO-PERF-2: every card grid's image sizes follow its column breakpoints", () => {
  for (const [columns, grid] of Object.entries(cardGrids)) {
    assert.deepEqual(
      sizesBreakpoints(grid.sizes),
      gridBreakpoints(grid.className),
      `${columns} columns`,
    );
    assert.match(grid.className, new RegExp(`xl:grid-cols-${columns}\\b`));
  }
});

function mediaSizes(card: ReactElement<Record<string, unknown>>) {
  const media = card.props.media;
  assert.ok(isValidElement<Record<string, unknown>>(media));
  return media.props.sizes;
}

test("SEO-PERF-2: the cards announce the sizes of the grid they sit in", () => {
  const withCover: PublicArticleSummary = article("tr");
  assert.equal(
    mediaSizes(
      ArticleCard({
        article: withCover,
        content: articlePageContent.tr,
        headingLevel: "h3",
      }),
    ),
    cardGrids[3].sizes,
  );
  assert.equal(mediaSizes(PhotoCard({ photo: photo() })), cardGrids[3].sizes);
  assert.equal(
    mediaSizes(PhotoCard({ photo: photo(), columns: 4 })),
    cardGrids[4].sizes,
  );

  const strip = PhotoCardList({ photos: [photo()], columns: 4 });
  assert.equal(strip.props.className, cardGrids[4].className);
  assert.equal(ofType(strip, PhotoCard)[0]?.props.columns, 4);
  const list = PhotoCardList({ photos: [photo()] });
  assert.equal(list.props.className, cardGrids[3].className);
});

// The list pages and the photo page load server-only modules, so their grids
// are checked in the source: the card grids come from cardGrids only.
for (const file of [
  "src/components/articles/ArticleListPage.tsx",
  "src/components/books/BookReviewListPage.tsx",
  "src/components/photos/PhotoListPage.tsx",
  "src/components/photos/PhotoDetailContent.tsx",
  "src/components/pages/PublicationCardLists.tsx",
]) {
  test(`SEO-PERF-2: ${file} takes its card grid from cardGrids`, () => {
    const source = readFileSync(path.join(process.cwd(), file), "utf8");
    assert.doesNotMatch(source, /<ul\s+className="[^"]*grid-cols-/);
  });
}

test("SEO-PERF-2: no card hard-codes its image sizes", () => {
  for (const file of [
    "src/components/articles/ArticleCard.tsx",
    "src/components/books/BookReviewCard.tsx",
    "src/components/photos/PhotoCard.tsx",
  ]) {
    const source = readFileSync(path.join(process.cwd(), file), "utf8");
    assert.match(source, /sizes=\{cardGrids\[/, file);
  }
});

// HomePage and WorkspacePage load server-only data modules, so their use of
// the shared lists is checked in the source: no local card copies remain.
for (const file of [
  "src/components/HomePage.tsx",
  "src/components/workspaces/WorkspacePage.tsx",
]) {
  test(`${file} renders publications only through the shared card lists`, () => {
    const source = readFileSync(path.join(process.cwd(), file), "utf8");

    assert.match(source, /from "@\/components\/pages\/PublicationCardLists"/);
    assert.doesNotMatch(source, /from "next\/image"/);
    assert.doesNotMatch(source, /function (Article|Photo|Book)\w*Card\b/);
  });
}
