import assert from "node:assert/strict";
import test from "node:test";
import {
  articleListPaths,
  getArticleLanguagePaths,
  getArticlePath,
  getArticleUrl,
} from "./articles/article-routes";
import {
  bookListPaths,
  getBookReviewLanguagePaths,
  getBookReviewPath,
  getBookReviewUrl,
} from "./books/book-routes";
import {
  getPhotoLanguagePaths,
  getPhotoListPath,
  getPhotoPath,
  photoListPaths,
} from "./photos/photo-routes";
import { createPublicationRoutes } from "./publication-routes";

test("ARCHITECTURE-6: one factory builds the detail routes below the list pages", () => {
  const routes = createPublicationRoutes({ tr: "/liste", en: "/en/list" });

  assert.equal(routes.getPath("ornek", "tr"), "/liste/ornek");
  assert.equal(routes.getPath("example", "en"), "/en/list/example");
  assert.equal(
    routes.getUrl("ornek", "tr"),
    "https://www.sabandurali.com/liste/ornek",
  );

  // Without a translation the other locale falls back to its list page.
  assert.deepEqual(
    routes.getLanguagePaths({ language: "tr", slug: "ornek" }, null),
    { tr: "/liste/ornek", en: "/en/list" },
  );
  assert.deepEqual(
    routes.getLanguagePaths(
      { language: "en", slug: "example" },
      { language: "tr", slug: "ornek" },
    ),
    { tr: "/liste/ornek", en: "/en/list/example" },
  );
});

test("articles, book reviews and photos keep their paths and URLs", () => {
  assert.deepEqual(articleListPaths, { tr: "/makaleler", en: "/en/articles" });
  assert.deepEqual(bookListPaths, { tr: "/kitaplar", en: "/en/books" });
  assert.deepEqual(photoListPaths, {
    tr: "/fotograflar",
    en: "/en/photography",
  });

  assert.equal(
    getArticlePath("kentsel-donusum", "tr"),
    "/makaleler/kentsel-donusum",
  );
  assert.equal(
    getArticleUrl("urban-renewal", "en"),
    "https://www.sabandurali.com/en/articles/urban-renewal",
  );
  assert.equal(getBookReviewPath("kitap", "tr"), "/kitaplar/kitap");
  assert.equal(
    getBookReviewUrl("book", "en"),
    "https://www.sabandurali.com/en/books/book",
  );
  assert.equal(getPhotoPath("galata", "en"), "/en/photography/galata");

  assert.deepEqual(
    getArticleLanguagePaths(
      { language: "tr", slug: "kentsel-donusum" },
      { language: "en", slug: "urban-renewal" },
    ),
    { tr: "/makaleler/kentsel-donusum", en: "/en/articles/urban-renewal" },
  );
  assert.deepEqual(
    getBookReviewLanguagePaths({ language: "en", slug: "book" }, null),
    { tr: "/kitaplar", en: "/en/books/book" },
  );
  assert.deepEqual(
    getPhotoLanguagePaths({ language: "tr", slug: "galata" }, null),
    { tr: "/fotograflar/galata", en: "/en/photography" },
  );
  assert.equal(
    getPhotoListPath("tr", { collection: "istanbul", tag: "kopru" }, 2),
    "/fotograflar?collection=istanbul&tag=kopru&page=2",
  );
});
