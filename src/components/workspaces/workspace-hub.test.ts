import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { isValidElement, type ReactElement } from "react";
import { PhotoCardList } from "@/components/pages/PublicationCardLists";
import Card from "@/components/ui/Card";
import DistrictKeyMap from "@/components/ui/DistrictKeyMap";
import type { PublicPhoto } from "@/content/photos/types";
import { getWorkspace, workspaces, type Workspace } from "@/content/workspaces";
import { WorkspaceHubFeatureSlot, WorkspaceHubSections } from "./WorkspaceHub";
import {
  orderWorkspaceHubEntries,
  selectWorkspaceHubPhotos,
  workspaceHubCountLabel,
  workspaceHubFeedCount,
  type WorkspaceHubEntry,
} from "./workspace-hub";
import { getListedWorkspaceEntries } from "./workspace-routes";

function requireTestWorkspace(key: Workspace["key"]): Workspace {
  const workspace = getWorkspace(key);
  assert.ok(workspace);
  return workspace;
}

const realEstate = requireTestWorkspace("gayrimenkul-ve-istanbul");
const photography = requireTestWorkspace("fotograf");

function hubEntries(
  workspace: Workspace,
  counts: ReadonlyArray<number | null>,
): WorkspaceHubEntry[] {
  return getListedWorkspaceEntries(workspace).map((entry, index) => ({
    entry,
    unit: "item",
    count: index < counts.length ? (counts[index] ?? null) : 0,
  }));
}

function elements(node: unknown): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  const props = node.props;
  return [node, ...elements(props.children), ...elements(props.eyebrow)];
}

function texts(node: unknown): string[] {
  if (typeof node === "string") return [node];
  if (Array.isArray(node)) return node.flatMap(texts);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return texts(node.props.children);
}

test("WORKSPACE-HUB: filled sections lead, uncounted ones follow, empty ones close", () => {
  const entries = hubEntries(realEstate, [null, 0, 4, 1]);
  const ordered = orderWorkspaceHubEntries(entries).map(
    (item) => item.entry.slug,
  );
  const slugs = entries.map((item) => item.entry.slug);
  assert.deepEqual(ordered, [slugs[2], slugs[3], slugs[0], slugs[1]]);
  // An empty section closes the list even when it comes first.
  const emptyFirst = hubEntries(realEstate, [0, null, 4, 1]);
  const emptySlugs = emptyFirst.map((item) => item.entry.slug);
  assert.deepEqual(
    orderWorkspaceHubEntries(emptyFirst).map((item) => item.entry.slug),
    [emptySlugs[2], emptySlugs[3], emptySlugs[1], emptySlugs[0]],
  );
  // The registry order is kept inside a group.
  const allEmpty = hubEntries(realEstate, [0, 0, 0, 0]);
  assert.deepEqual(
    orderWorkspaceHubEntries(allEmpty).map((item) => item.entry.slug),
    allEmpty.map((item) => item.entry.slug),
  );
});

test("WORKSPACE-HUB: count labels say what a section holds, never a guess", () => {
  assert.equal(workspaceHubCountLabel({ count: 3, unit: "item" }), "3 yayın");
  assert.equal(
    workspaceHubCountLabel({ count: 0, unit: "item" }),
    "Henüz yayın yok",
  );
  assert.equal(
    workspaceHubCountLabel({ count: 12, unit: "guide" }),
    "12 ilçe rehberi",
  );
  assert.equal(
    workspaceHubCountLabel({ count: 0, unit: "guide" }),
    "Henüz yayımlanmış rehber yok",
  );
  assert.equal(workspaceHubCountLabel({ count: null, unit: "item" }), null);
});

test("WORKSPACE-HUB: section cards show their count in hub order", () => {
  const entries = orderWorkspaceHubEntries(
    hubEntries(realEstate, [null, 0, 2, 0]),
  );
  const tree = WorkspaceHubSections({ workspace: realEstate, entries });
  const cards = elements(tree).filter((element) => element.type === Card);
  assert.deepEqual(
    cards.map((card) => card.props.title),
    entries.map((item) => item.entry.title),
  );
  assert.deepEqual(texts(cards[0]?.props.eyebrow), ["2 yayın"]);
  assert.equal(cards[1]?.props.eyebrow, undefined);
  assert.deepEqual(texts(cards[3]?.props.eyebrow), ["Henüz yayın yok"]);
});

test("WORKSPACE-HUB: the real-estate hub features a district on the key map", () => {
  const tree = WorkspaceHubFeatureSlot({
    workspace: realEstate,
    feature: { kind: "district", slug: "kadikoy", summary: "Özet metni." },
  });
  const all = elements(tree);
  const map = all.find((element) => element.type === DistrictKeyMap);
  assert.equal(map?.props.featuredSlug, "kadikoy");
  assert.equal(typeof map?.props.title, "string");
  const card = all.find((element) => element.type === Card);
  assert.equal(card?.props.href, "/istanbul/ilceler/kadikoy");
  assert.equal(card?.props.title, "Kadıköy");
  // An unknown district renders nothing rather than an invented card.
  assert.equal(
    WorkspaceHubFeatureSlot({
      workspace: realEstate,
      feature: { kind: "district", slug: "atlantis", summary: "x" },
    }),
    null,
  );
});

test("WORKSPACE-HUB: the photography hub features the newest photographs", () => {
  const photos = [{ id: "p1" } as PublicPhoto];
  const all = elements(
    WorkspaceHubFeatureSlot({
      workspace: photography,
      feature: { kind: "photos", photos },
    }),
  );
  const list = all.find((element) => element.type === PhotoCardList);
  assert.equal(list?.props.photos, photos);
  assert.equal(list?.props.columns, 4);
});

test("WORKSPACE-HUB: every hub route refreshes hourly like its sections", () => {
  for (const workspace of workspaces) {
    const file = fileURLToPath(
      new URL(`../../app/(tr)/${workspace.key}/page.tsx`, import.meta.url),
    );
    const source = readFileSync(file, "utf8");
    assert.match(source, /^export const revalidate = 3600;$/m, workspace.key);
    assert.match(source, /<WorkspaceLandingPage/, workspace.key);
  }
});

test("WORKSPACE-HUB: a count comes from the section feed, never a guess", () => {
  const photo = { id: "p1" } as PublicPhoto;
  assert.equal(workspaceHubFeedCount({ items: [photo, photo, photo] }), 3);
  assert.equal(workspaceHubFeedCount({ items: [] }), 0);
  // A section without a feed shows its empty state, so it counts 0.
  assert.equal(workspaceHubFeedCount({ items: null }), 0);
  // A feed that could not be read is not counted.
  assert.equal(workspaceHubFeedCount(null), null);
});

test("WORKSPACE-HUB: the photography hub features at most four photographs", () => {
  const photos = ["p1", "p2", "p3", "p4", "p5"].map(
    (id) => ({ id }) as PublicPhoto,
  );
  assert.deepEqual(
    selectWorkspaceHubPhotos({ photos }).map((photo) => photo.id),
    ["p1", "p2", "p3", "p4"],
  );
  assert.deepEqual(selectWorkspaceHubPhotos({ photos: [] }), []);
  assert.deepEqual(selectWorkspaceHubPhotos(null), []);
});

test("WORKSPACE-HUB: the hub loader uses the shared count and photo helpers", () => {
  // workspace-hub-data.ts loads server-only data sources, so its wiring is
  // checked on the source, like HomePage in home-selection.test.ts.
  const source = readFileSync(
    fileURLToPath(new URL("./workspace-hub-data.ts", import.meta.url)),
    "utf8",
  );
  assert.match(source, /count: workspaceHubFeedCount\(feed\)/);
  assert.match(source, /load: \(\) => getWorkspaceEntryFeed\(entry\)/);
  assert.match(source, /selectWorkspaceHubPhotos\(list\)/);
});
