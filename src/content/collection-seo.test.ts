import assert from "node:assert/strict";
import test from "node:test";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import {
  createArticleListJsonLd,
  createBookReviewListJsonLd,
  createCollectionPageJsonLd,
} from "./collection-seo";

const site = "https://www.sabandurali.com";

function article(
  overrides: Partial<PublicArticleSummary> &
    Pick<PublicArticleSummary, "id" | "slug">,
): PublicArticleSummary {
  return {
    title: overrides.slug,
    language: "tr",
    translationKey: null,
    summary: "Özet",
    categories: [],
    featuredImage: null,
    featured: false,
    articleType: "article",
    district: null,
    districtNeighborhood: null,
    newsCategory: null,
    externalSource: null,
    publishedAt: "2026-05-01T09:00:00.000Z",
    createdAt: "2026-05-01T09:00:00.000Z",
    updatedAt: "2026-05-02T09:00:00.000Z",
    seo: { title: "T", description: "D", index: true, follow: true },
    ...overrides,
  };
}

test("ARTICLE-BOOK-JSONLD: an empty list publishes no CollectionPage", () => {
  assert.equal(createArticleListJsonLd("tr", []), null);
  assert.equal(createBookReviewListJsonLd("en", []), null);
  assert.equal(
    createCollectionPageJsonLd({
      locale: "tr",
      name: "Makaleler",
      description: "D",
      path: "/makaleler",
      items: [],
    }),
    null,
  );
});

test("ARTICLE-BOOK-JSONLD: the article list is a CollectionPage of its indexable items", () => {
  const jsonLd = createArticleListJsonLd("tr", [
    article({ id: "1", slug: "birinci", title: "Birinci yazı" }),
    article({
      id: "2",
      slug: "gizli",
      seo: { title: "T", description: "D", index: false, follow: true },
    }),
    article({
      id: "3",
      slug: "baska-yerde",
      seo: {
        title: "T",
        description: "D",
        index: true,
        follow: true,
        canonical: "https://example.com/asil",
      },
    }),
    article({ id: "4", slug: "ikinci", title: "İkinci yazı" }),
  ]);
  assert.ok(jsonLd);
  const [page, breadcrumb] = jsonLd["@graph"];
  assert.equal(page["@type"], "CollectionPage");
  assert.equal(page.url, `${site}/makaleler`);
  assert.equal(page.name, "Makaleler");
  assert.equal(page.inLanguage, "tr-TR");
  assert.equal(page.isPartOf["@id"], `${site}/#website`);
  assert.deepEqual(page.mainEntity, {
    "@type": "ItemList",
    numberOfItems: 2,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Birinci yazı",
        url: `${site}/makaleler/birinci`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "İkinci yazı",
        url: `${site}/makaleler/ikinci`,
      },
    ],
  });
  assert.deepEqual(
    breadcrumb.itemListElement.map((item) => [item.name, item.item]),
    [
      ["Ana sayfa", `${site}/`],
      ["Makaleler", `${site}/makaleler`],
    ],
  );
  assert.deepEqual(page.breadcrumb, { "@id": breadcrumb["@id"] });
});

test("ARTICLE-BOOK-JSONLD: a list names only items of its own language", () => {
  const jsonLd = createArticleListJsonLd("en", [
    article({ id: "1", slug: "turkce" }),
    article({ id: "2", slug: "english", language: "en", title: "English" }),
  ]);
  assert.ok(jsonLd);
  assert.equal(jsonLd["@graph"][0].mainEntity.numberOfItems, 1);
  assert.equal(jsonLd["@graph"][0].url, `${site}/en/articles`);
  assert.equal(jsonLd["@graph"][1].itemListElement[0]?.name, "Home");
});
