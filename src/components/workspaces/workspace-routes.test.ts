import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import type { PublicPhoto } from "@/content/photos/types";
import {
  getWorkspaceEntry,
  getWorkspaceSectionParams,
  workspaces,
  type WorkspaceKey,
} from "@/content/workspaces";
import {
  createWorkspaceMetadata,
  getListedWorkspaceEntries,
  isWorkspaceEntryIndexable,
  requireWorkspace,
  resolveWorkspaceSection,
  selectWorkspaceEntryFeed,
} from "./workspace-routes";

const stamp = "2026-10-01T09:00:00.000Z";

function article(
  id: string,
  categorySlug: string,
  language: "tr" | "en" = "tr",
): PublicArticleSummary {
  return {
    id,
    title: id,
    slug: id,
    language,
    translationKey: null,
    summary: "",
    categories: [
      {
        id: categorySlug,
        name: categorySlug,
        slug: categorySlug,
        sortOrder: 0,
      },
    ],
    featuredImage: null,
    featured: false,
    articleType: "article",
    district: null,
    districtNeighborhood: null,
    newsCategory: null,
    externalSource: null,
    publishedAt: stamp,
    createdAt: stamp,
    updatedAt: stamp,
    seo: { title: id, description: "", index: true, follow: true },
  };
}

function photo(
  id: string,
  collectionSlug: string | null,
  tagSlug: string | null,
): PublicPhoto {
  return {
    id,
    language: "tr",
    title: id,
    slug: id,
    description: null,
    image: { src: `/media/${id}.jpg`, alt: id },
    collections:
      collectionSlug === null
        ? []
        : [
            {
              id: collectionSlug,
              title: collectionSlug,
              slug: collectionSlug,
              parentId: null,
              sortOrder: 0,
            },
          ],
    tags:
      tagSlug === null ? [] : [{ id: tagSlug, title: tagSlug, slug: tagSlug }],
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
    seo: { title: id, description: "", openGraphImage: null },
  };
}

const site = "https://www.sabandurali.com";

test("requireWorkspace returns every route folder's workspace", () => {
  for (const workspace of workspaces) {
    assert.equal(requireWorkspace(workspace.key), workspace);
  }
  assert.throws(() => requireWorkspace("yok" as WorkspaceKey), /Unknown/);
});

test("every prerendered section resolves to its page", () => {
  for (const workspace of workspaces) {
    for (const { section } of getWorkspaceSectionParams(workspace.key)) {
      const target = resolveWorkspaceSection(workspace.key, section);
      assert.equal(target.kind, "page", `${workspace.key}/${section}`);
    }
  }
});

test("entries that live elsewhere redirect there; unknown sections are 404", () => {
  assert.deepEqual(
    resolveWorkspaceSection("gayrimenkul-ve-istanbul", "ilce-rehberi"),
    { kind: "redirect", href: "/istanbul/ilceler" },
  );
  assert.deepEqual(
    resolveWorkspaceSection("kitaplar-ve-ogrenme", "kitap-incelemeleri"),
    { kind: "redirect", href: "/kitaplar" },
  );
  assert.deepEqual(resolveWorkspaceSection("fotograf", "galeriler"), {
    kind: "redirect",
    href: "/fotograflar",
  });
  assert.deepEqual(resolveWorkspaceSection("fotograf", "yok"), {
    kind: "not-found",
  });
  assert.deepEqual(resolveWorkspaceSection("yok", "istanbul"), {
    kind: "not-found",
  });
});

test("workspace pages list every section except the unpublished tools", () => {
  const realEstate = requireWorkspace("gayrimenkul-ve-istanbul");
  const listed = getListedWorkspaceEntries(realEstate).map(
    (entry) => entry.slug,
  );
  assert.ok(!listed.includes("hesaplama-araclari"));
  assert.equal(listed.length, realEstate.entries.length - 1);
});

test("a section is indexable only with published items", () => {
  assert.equal(isWorkspaceEntryIndexable(null), false);
  assert.equal(isWorkspaceEntryIndexable([]), false);
  assert.equal(isWorkspaceEntryIndexable([{}]), true);
});

test("FE-7: workspace metadata goes through the shared builder", () => {
  const metadata = createWorkspaceMetadata(
    "Satış",
    "Satış pratiğine ilişkin yayınlar.",
    "/satis-ve-muzakere/satis",
    { index: false },
  );

  assert.equal(metadata.title, "Satış | Şaban Durali");
  assert.deepEqual(metadata.robots, { index: false, follow: true });
  assert.equal(
    metadata.alternates?.canonical,
    `${site}/satis-ve-muzakere/satis`,
  );
  assert.deepEqual(metadata.alternates?.languages, {
    "tr-TR": `${site}/satis-ve-muzakere/satis`,
  });
  assert.ok(metadata.openGraph);
  assert.equal((metadata.openGraph as { locale?: string }).locale, "tr_TR");
  assert.equal(
    (metadata.twitter as { card?: string } | undefined)?.card,
    "summary_large_image",
  );

  const indexed = createWorkspaceMetadata("Fotoğraf", "x", "/fotograf");
  assert.deepEqual(indexed.robots, { index: true, follow: true });
});

test("FE-V1: a section shows exactly the items the sitemap counts", () => {
  const research = getWorkspaceEntry("arastirma-ve-analiz", "veri-ve-analiz");
  assert.ok(research);
  // A query may return more than the sitemap rule accepts (an English
  // article, another category): the page drops them as well.
  const articles = [
    article("a1", "analiz"),
    article("a2", "analiz", "en"),
    article("a3", "sehir"),
  ];
  const researchFeed = selectWorkspaceEntryFeed(research, articles, []);
  assert.deepEqual(
    researchFeed.articles.map((item) => item.id),
    ["a1"],
  );
  assert.deepEqual(
    researchFeed.items?.map((item) => item.id),
    ["a1"],
  );
  assert.equal(isWorkspaceEntryIndexable(researchFeed.items), true);

  const street = getWorkspaceEntry("fotograf", "sokak");
  assert.ok(street);
  const photos = [
    photo("p1", "sokak", null),
    photo("p2", null, "sokak"),
    photo("p3", "doga", null),
  ];
  const streetFeed = selectWorkspaceEntryFeed(street, [], photos);
  assert.deepEqual(
    streetFeed.photos.map((item) => item.id),
    ["p1", "p2"],
  );
  assert.equal(streetFeed.items?.length, 2);

  const tools = getWorkspaceEntry(
    "gayrimenkul-ve-istanbul",
    "hesaplama-araclari",
  );
  assert.ok(tools);
  const toolsFeed = selectWorkspaceEntryFeed(tools, articles, photos);
  assert.equal(toolsFeed.items, null);
  assert.deepEqual(toolsFeed.articles, []);
  assert.equal(isWorkspaceEntryIndexable(toolsFeed.items), false);

  const emptyFeed = selectWorkspaceEntryFeed(research, [], []);
  assert.deepEqual(emptyFeed.items, []);
  assert.equal(isWorkspaceEntryIndexable(emptyFeed.items), false);
});

test("every [section] route is prerendered with an hourly safety net", () => {
  for (const workspace of workspaces) {
    const file = fileURLToPath(
      new URL(
        `../../app/(tr)/${workspace.key}/[section]/page.tsx`,
        import.meta.url,
      ),
    );
    const source = readFileSync(file, "utf8");

    assert.match(source, /^export const revalidate = 3600;$/m, workspace.key);
    assert.match(
      source,
      new RegExp(`getWorkspaceSectionParams\\("${workspace.key}"\\)`),
      workspace.key,
    );
    assert.match(
      source,
      new RegExp(`createWorkspaceSectionRoute\\("${workspace.key}"\\)`),
      workspace.key,
    );
    assert.match(source, /export const generateMetadata = /, workspace.key);
  }
});
