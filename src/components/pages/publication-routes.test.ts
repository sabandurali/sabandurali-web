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
  assert.deepEqual(publicationNotFoundMetadata("article", "tr"), {
    title: "Makale bulunamadı | Şaban Durali",
    robots: { index: false, follow: false },
  });
  assert.equal(
    publicationNotFoundMetadata("bookReview", "en").title,
    "Book review not found | Şaban Durali",
  );
  assert.equal(
    publicationNotFoundMetadata("photo", "tr").title,
    "Fotoğraf bulunamadı | Şaban Durali",
  );
  assert.deepEqual(publicationNotFoundMetadata("photo", "en").robots, {
    index: false,
    follow: false,
  });
});
