import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { PublicArticleSummary } from "../articles/public-types";
import { homeContent } from "../homeContent";
import { getWorkspaceEntryItems } from "../../lib/sitemap-entries";
import type { PublicPhoto } from "../photos/public-types";
import { isWorkspaceEntryIndexable } from "../../components/workspaces/workspace-routes";
import type { PublicNavigationLink } from "./public-types";
import { getStaticHeaderNavigationItems } from "./static-navigation";
import { sectionHasContent, workspaces } from "../workspaces";
import {
  collectPublishedWorkspaceFeeds,
  toPublishedWorkspaceFeeds,
  withoutEmptyWorkspaceSections,
} from "./workspace-sections";

const date = "2026-01-01T00:00:00.000Z";

function article(
  language: "tr" | "en",
  ...slugs: string[]
): PublicArticleSummary {
  return {
    id: slugs.join("-"),
    title: "Test",
    slug: slugs.join("-"),
    language,
    translationKey: null,
    summary: "Test",
    categories: slugs.map((slug, index) => ({
      id: slug,
      name: slug,
      slug,
      sortOrder: index,
    })),
    featuredImage: null,
    featured: false,
    articleType: "article",
    district: null,
    districtNeighborhood: null,
    newsCategory: null,
    externalSource: null,
    publishedAt: date,
    createdAt: date,
    updatedAt: date,
    seo: { title: "Test", description: "Test", index: true, follow: true },
  };
}

function photo(
  language: "tr" | "en",
  collections: string[],
  tags: string[] = [],
): PublicPhoto {
  return {
    id: [...collections, ...tags].join("-"),
    language,
    title: "Test",
    slug: "test",
    description: null,
    image: { src: "/media/test.jpg", alt: "Test" },
    collections: collections.map((slug, index) => ({
      id: slug,
      title: slug,
      slug,
      parentId: null,
      sortOrder: index,
    })),
    tags: tags.map((slug) => ({ id: slug, title: slug, slug })),
    takenAt: null,
    locationName: null,
    district: null,
    neighborhood: null,
    districtPhotoCategory: null,
    dayPeriod: null,
    photographer: "Test",
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
    publishedAt: date,
    createdAt: date,
    updatedAt: date,
    seo: { title: "Test", description: "Test", openGraphImage: null },
  };
}

const turkishItems = getStaticHeaderNavigationItems({
  locale: "tr",
  anchors: homeContent.tr.anchors,
  content: homeContent.tr.header,
  anchorPrefix: "/",
});

function hrefs(items: readonly PublicNavigationLink[]): string[] {
  return items.flatMap((item) => [
    ...(item.href === null ? [] : [item.href]),
    ...hrefs(item.children),
  ]);
}

const sectionPaths = new Set(
  workspaces.flatMap((workspace) =>
    workspace.entries
      .filter((entry) => entry.href === `/${workspace.key}/${entry.slug}`)
      .map((entry) => entry.href),
  ),
);

test("NAV-EMPTY-SECTIONS: without published content no section page is in the menu", () => {
  const feeds = toPublishedWorkspaceFeeds(
    collectPublishedWorkspaceFeeds([], []),
  );
  const before = hrefs(turkishItems);
  assert.ok(before.some((href) => sectionPaths.has(href)));
  const after = hrefs(withoutEmptyWorkspaceSections(turkishItems, feeds));
  assert.deepEqual(
    after.filter((href) => sectionPaths.has(href)),
    [],
  );
  // The workspaces, the district guide and the archives stay.
  for (const href of [
    "/gayrimenkul-ve-istanbul",
    "/satis-ve-muzakere",
    "/istanbul/ilceler",
    "/istanbul/ilceler/esenler",
    "/kitaplar",
    "/fotograflar",
    "/hakkimda",
    "/iletisim",
  ]) {
    assert.ok(after.includes(href), href);
  }
});

test("NAV-EMPTY-SECTIONS: a section returns with its first Turkish item, never an English one", () => {
  const feeds = toPublishedWorkspaceFeeds(
    collectPublishedWorkspaceFeeds(
      [article("tr", "satis"), article("en", "muzakere")],
      [photo("tr", [], ["sokak"]), photo("en", ["doga"])],
    ),
  );
  const after = hrefs(withoutEmptyWorkspaceSections(turkishItems, feeds));
  assert.ok(after.includes("/satis-ve-muzakere/satis"));
  assert.ok(after.includes("/fotograf/sokak"));
  assert.ok(!after.includes("/satis-ve-muzakere/muzakere"));
  assert.ok(!after.includes("/fotograf/doga"));
});

test("NAV-EMPTY-SECTIONS: every section left in the menu is indexable (sitemap rule)", () => {
  const articles = [
    article("tr", "gayrimenkul", "sehir"),
    article("tr", "yapay-zeka"),
    article("en", "chatgpt"),
  ];
  const photos = [photo("tr", ["istanbul"], ["doga"]), photo("en", ["sokak"])];
  const feeds = toPublishedWorkspaceFeeds(
    collectPublishedWorkspaceFeeds(articles, photos),
  );
  for (const workspace of workspaces) {
    for (const entry of workspace.entries) {
      if (!sectionPaths.has(entry.href)) {
        assert.equal(sectionHasContent(workspace.key, entry, feeds), true);
        continue;
      }
      const items = getWorkspaceEntryItems(entry, articles, photos);
      assert.equal(
        sectionHasContent(workspace.key, entry, feeds),
        isWorkspaceEntryIndexable(items),
        entry.href,
      );
    }
  }
  const menu = hrefs(withoutEmptyWorkspaceSections(turkishItems, feeds));
  assert.deepEqual(menu.filter((href) => sectionPaths.has(href)).sort(), [
    "/arastirma-ve-analiz/sehir-arastirmalari",
    "/fotograf/doga",
    "/fotograf/istanbul",
    "/gayrimenkul-ve-istanbul/gayrimenkul-rehberleri",
    "/gayrimenkul-ve-istanbul/sehir-ve-imar",
    "/yapay-zeka-ve-teknoloji/yapay-zeka",
  ]);
});

test("NAV-EMPTY-SECTIONS: the header reads the filter for both public sources", () => {
  const source = readFileSync(
    new URL("./navigation-data-source.ts", import.meta.url),
    "utf8",
  );
  assert.equal(
    [...source.matchAll(/return withPublishedWorkspaceSections\(/g)].length,
    2,
  );
  assert.match(source, /getAllPublishedArticles\("tr"\)/);
  assert.match(source, /getAllPublishedPhotos\("tr"\)/);
});
