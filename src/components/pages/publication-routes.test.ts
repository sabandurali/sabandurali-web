/**
 * ARCHITECTURE-10: the Turkish and English detail routes of articles, book
 * reviews and photos come from one factory per type, so a change to static
 * params, metadata or the not-found case reaches both languages at once.
 * The factories load server-only data sources, so the route files are
 * checked in the source and the shared not-found metadata directly.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { publicationListSeo } from "./publication-list-seo";
import { publicationNotFoundMetadata } from "./publication-not-found";

const routes = [
  ["src/app/(tr)/makaleler/[slug]/page.tsx", "createArticleDetailRoute", "tr"],
  [
    "src/app/(en)/en/articles/[slug]/page.tsx",
    "createArticleDetailRoute",
    "en",
  ],
  [
    "src/app/(tr)/kitaplar/[slug]/page.tsx",
    "createBookReviewDetailRoute",
    "tr",
  ],
  [
    "src/app/(en)/en/books/[slug]/page.tsx",
    "createBookReviewDetailRoute",
    "en",
  ],
  ["src/app/(tr)/fotograflar/[slug]/page.tsx", "createPhotoDetailRoute", "tr"],
  [
    "src/app/(en)/en/photography/[slug]/page.tsx",
    "createPhotoDetailRoute",
    "en",
  ],
] as const;

for (const [file, factory, locale] of routes) {
  test(`${file} is built by ${factory}("${locale}")`, () => {
    const source = readFileSync(path.join(process.cwd(), file), "utf8");

    assert.match(source, new RegExp(`${factory}\\("${locale}"\\)`));
    assert.match(source, /^export const revalidate = 3600;$/m);
    assert.match(
      source,
      /^export const generateStaticParams = route\.generateStaticParams;$/m,
    );
    assert.match(
      source,
      /^export const generateMetadata = route\.generateMetadata;$/m,
    );
    assert.match(source, /<route\.Page \{\.\.\.props\} \/>/);
    // No second copy of the data loading or the not-found title.
    assert.doesNotMatch(source, /@\/content\//);
    assert.doesNotMatch(source, /bulunamadı|not found/i);
  });
}

test("a missing publication has a localized, non-indexed title", () => {
  // The titles the six route files used before the factories.
  const expected = {
    tr: {
      article: "Makale bulunamadı",
      bookReview: "Kitap incelemesi bulunamadı",
      photo: "Fotoğraf bulunamadı",
    },
    en: {
      article: "Article not found",
      bookReview: "Book review not found",
      photo: "Photography not found",
    },
  } as const;

  for (const locale of ["tr", "en"] as const) {
    for (const kind of ["article", "bookReview", "photo"] as const) {
      assert.deepEqual(publicationNotFoundMetadata(kind, locale), {
        title: `${expected[locale][kind]} | Şaban Durali`,
        robots: { index: false, follow: false },
      });
    }
  }
});

const read = (file: string) =>
  readFileSync(path.join(process.cwd(), file), "utf8");

const listRoutes = [
  ["src/app/(tr)/makaleler/page.tsx", "createArticleListRoute", "tr", true],
  ["src/app/(en)/en/articles/page.tsx", "createArticleListRoute", "en", true],
  ["src/app/(tr)/kitaplar/page.tsx", "createBookReviewListRoute", "tr", true],
  ["src/app/(en)/en/books/page.tsx", "createBookReviewListRoute", "en", true],
  ["src/app/(tr)/fotograflar/page.tsx", "createPhotoListRoute", "tr", false],
  ["src/app/(en)/en/photography/page.tsx", "createPhotoListRoute", "en", false],
] as const;

for (const [file, factory, locale, prerendered] of listRoutes) {
  test(`ARCHITECTURE-10: ${file} is built by ${factory}("${locale}")`, () => {
    const source = read(file);

    assert.match(source, new RegExp(`${factory}\\("${locale}"\\)`));
    assert.match(
      source,
      /^export const generateMetadata = route\.generateMetadata;$/m,
    );
    assert.match(source, /<route\.Page (\{\.\.\.props\} )?\/>/);
    // The article and book lists are prerendered hourly; the photo list
    // reads the query string and renders per request.
    if (prerendered) {
      assert.match(source, /^export const revalidate = 3600;$/m);
    } else {
      assert.doesNotMatch(source, /export const revalidate/);
    }
    assert.doesNotMatch(source, /@\/content\//);
    assert.doesNotMatch(source, /Şaban Durali/);
  });
}

test("the list titles keep their wording in both languages", () => {
  assert.equal(publicationListSeo.article.tr.title, "Makaleler | Şaban Durali");
  assert.equal(publicationListSeo.article.en.title, "Articles | Şaban Durali");
  assert.equal(
    publicationListSeo.bookReview.tr.title,
    "Kitaplar | Şaban Durali",
  );
  assert.equal(publicationListSeo.bookReview.en.title, "Books | Şaban Durali");
});

test("each list factory reads the titles of its own type", () => {
  const source = read("src/components/pages/publication-list-routes.tsx");
  const factory = (name: string) => {
    const start = source.indexOf(`export function ${name}(`);
    assert.ok(start >= 0, name);
    const end = source.indexOf("\nexport function ", start + 1);
    return source.slice(start, end === -1 ? undefined : end);
  };
  assert.match(
    factory("createArticleListRoute"),
    /\.\.\.publicationListSeo\.article\[locale\],\s*locale,\s*paths: articleListPaths,/,
  );
  assert.match(
    factory("createBookReviewListRoute"),
    /\.\.\.publicationListSeo\.bookReview\[locale\],\s*locale,\s*paths: bookListPaths,/,
  );
});

test("the photo detail page lists related photos of the served photo", () => {
  // The factory loads server-only data sources, so its wiring is read from
  // the source: the related photos come from the served photo and reach
  // the page.
  const source = read("src/components/pages/publication-routes.tsx");
  const photoPage = source.slice(
    source.indexOf("async function PhotoRoutePage"),
  );
  assert.match(
    photoPage,
    /if \(photo === null\) notFound\(\);\s*const related = await getRelatedPublishedPhotos\(photo\);/,
  );
  assert.match(photoPage, /related=\{related\}/);
});
