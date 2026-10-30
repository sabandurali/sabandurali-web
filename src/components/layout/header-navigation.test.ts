import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { NavMenuItem } from "../ui/NavMenu";
import { homeContent } from "../../content/homeContent";
import {
  getEnglishHeaderNavigationItems,
  getStaticHeaderNavigationItems,
} from "../../content/navigation/static-navigation";
import type { PublicNavigationLink } from "../../content/navigation/public-types";
import {
  isCurrentLink,
  normalizePathname,
  toNavMenuItems,
} from "./header-navigation";

const turkishItems = getStaticHeaderNavigationItems({
  locale: "tr",
  anchors: homeContent.tr.anchors,
  content: homeContent.tr.header,
  anchorPrefix: "/",
});

function walk(items: readonly NavMenuItem[]): NavMenuItem[] {
  return items.flatMap((item) => [item, ...walk(item.children ?? [])]);
}

function link(
  id: string,
  href: string | null,
  children: PublicNavigationLink[] = [],
  extra: Partial<PublicNavigationLink> = {},
): PublicNavigationLink {
  return {
    id,
    label: id,
    href,
    external: false,
    newTab: false,
    children,
    ...extra,
  };
}

test("normalizePathname drops trailing slashes, queries and hashes", () => {
  assert.equal(normalizePathname("/makaleler/"), "/makaleler");
  assert.equal(normalizePathname("/makaleler?sayfa=2"), "/makaleler");
  assert.equal(normalizePathname("/hakkimda#egitim"), "/hakkimda");
  assert.equal(normalizePathname("/"), "/");
  assert.equal(normalizePathname(""), "/");
});

test("only same-site links without a hash can be the current page", () => {
  assert.equal(isCurrentLink(link("a", "/hakkimda"), "/hakkimda/"), true);
  assert.equal(isCurrentLink(link("b", "/hakkimda#bio"), "/hakkimda"), false);
  assert.equal(
    isCurrentLink(link("c", "mailto:x@example.com"), "/iletisim"),
    false,
  );
  assert.equal(
    isCurrentLink(
      link("d", "https://example.com/x", [], { external: true }),
      "/x",
    ),
    false,
  );
  assert.equal(isCurrentLink(link("e", "//evil.example/x"), "/x"), false);
});

test("the bar drops the home entry and mobile-only entries; the stack keeps them", () => {
  const items = [
    link("home", "/"),
    link("only-mobile", "/x", [], { mobileOnly: true }),
    link("contact", "/iletisim"),
    link("empty", null),
  ];
  assert.deepEqual(
    toNavMenuItems(items, "/", "bar").map((item) => item.id),
    ["contact"],
  );
  assert.deepEqual(
    toNavMenuItems(items, "/", "stack").map((item) => item.id),
    ["home", "only-mobile", "contact"],
  );
});

test("TR: the 39 district links survive as two labelled groups", () => {
  const bar = toNavMenuItems(turkishItems, "/", "bar");
  const realEstate = bar.find(
    (item) => item.id === "workspace-gayrimenkul-ve-istanbul",
  );
  assert.ok(realEstate);
  const children = realEstate.children ?? [];
  const groups = children.filter((child) => (child.children ?? []).length > 0);
  assert.deepEqual(
    groups.map((group) => [group.label, group.children?.length]),
    [
      ["Avrupa Yakası — 25", 25],
      ["Anadolu Yakası — 14", 14],
    ],
  );
  // Plain links come before the groups and keep the guide entry itself.
  const firstGroup = children.findIndex((child) => child.children?.length);
  assert.ok(
    children
      .slice(0, firstGroup)
      .some((child) => child.href === "/istanbul/ilceler"),
  );
  assert.ok(children.slice(firstGroup).every((child) => child.children));
  // No group nests deeper than NavMenu renders.
  for (const group of groups) {
    for (const leaf of group.children ?? []) {
      assert.equal(leaf.children, undefined);
    }
  }
});

test("TR: a district page is the single current link; its workspace is active", () => {
  const bar = toNavMenuItems(turkishItems, "/istanbul/ilceler/esenler", "bar");
  const current = walk(bar).filter((item) => item.current);
  assert.deepEqual(
    current.map((item) => item.href),
    ["/istanbul/ilceler/esenler"],
  );
  const active = bar.filter((item) => item.active);
  assert.deepEqual(
    active.map((item) => item.id),
    ["workspace-gayrimenkul-ve-istanbul"],
  );
});

test("a page below a section prefix activates the section without aria-current", () => {
  const items = [
    link("articles", "/makaleler", [], { activePathPrefix: "/makaleler" }),
    link("home", "/", [], { activePathPrefix: "/" }),
  ];
  const stack = toNavMenuItems(items, "/makaleler/bir-yazi", "stack");
  assert.deepEqual(
    stack.map((item) => [item.id, item.current, item.active]),
    [
      ["articles", false, true],
      ["home", false, false],
    ],
  );
  const onList = toNavMenuItems(items, "/makaleler", "stack");
  assert.deepEqual(
    onList.map((item) => [item.id, item.current, item.active]),
    [
      ["articles", true, false],
      ["home", false, false],
    ],
  );
});

test("TR: Hakkımda lists its page once; the hash sections are never current", () => {
  const bar = toNavMenuItems(turkishItems, "/hakkimda", "bar");
  const about = bar.find((item) => item.id === "about");
  assert.ok(about);
  assert.equal(about.current, true);
  const hrefs = (about.children ?? []).map((child) => child.href);
  assert.ok(!hrefs.includes("/hakkimda"), "the overview link already exists");
  assert.ok(hrefs.includes("/hakkimda#biyografi"));
  assert.ok((about.children ?? []).every((child) => !child.current));
});

test("EN: no panel repeats a link (overview, children or siblings)", () => {
  const bar = toNavMenuItems(getEnglishHeaderNavigationItems(), "/en", "bar");
  for (const item of bar) {
    const hrefs = [
      item.href,
      ...walk(item.children ?? []).map((child) => child.href),
    ].filter((href) => typeof href === "string");
    assert.equal(new Set(hrefs).size, hrefs.length, item.id);
  }
});

test("a CMS group whose own link repeats the parent keeps its links only", () => {
  const items = [
    link("parent", "/a", [link("group", "/a", [link("leaf", "/a/b")])]),
  ];
  const [parent] = toNavMenuItems(items, "/", "stack");
  const [group] = parent?.children ?? [];
  assert.equal(group?.href, null);
  assert.deepEqual(
    group?.children?.map((leaf) => leaf.href),
    ["/a/b"],
  );
});

/**
 * Section ids the English home page renders: its configured anchors and
 * the literal or per-locale ids of HomePage and the home sections.
 */
function englishHomeSectionIds(): Set<string> {
  const read = (path: string) =>
    readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
  const ids = new Set<string>(Object.values(homeContent.en.anchors));
  for (const file of [
    "components/HomePage.tsx",
    "components/sections/HomeAtlas.tsx",
  ]) {
    const source = read(file);
    for (const [, id] of source.matchAll(/<Section\s+id="([\w-]+)"/g)) {
      if (id !== undefined) ids.add(id);
    }
    for (const [, , en] of source.matchAll(
      /id=\{locale === "tr" \? "([\w-]+)" : "([\w-]+)"\}/g,
    )) {
      if (en !== undefined) ids.add(en);
    }
  }
  return ids;
}

test("NAV-EN-ANCHORS: every English home anchor is a section of the English home page", () => {
  const ids = englishHomeSectionIds();
  assert.ok(ids.has("istanbul") && ids.has("about") && ids.has("books"));
  const all = (
    items: readonly PublicNavigationLink[],
  ): PublicNavigationLink[] =>
    items.flatMap((item) => [item, ...all(item.children)]);
  const anchors = all(getEnglishHeaderNavigationItems()).flatMap((item) => {
    const match = /^\/en#(.+)$/.exec(item.href ?? "");
    return match?.[1] === undefined ? [] : [[item.id, match[1]] as const];
  });
  assert.ok(anchors.length > 0);
  for (const [id, hash] of anchors) {
    assert.ok(ids.has(hash), `${id}: #${hash} is not on /en`);
  }
});

test("NAV-EN-ANCHORS: no English entry opens a panel with a single link", () => {
  for (const item of toNavMenuItems(
    getEnglishHeaderNavigationItems(),
    "/en",
    "stack",
  )) {
    const links = [
      item.href,
      ...walk(item.children ?? []).map((c) => c.href),
    ].filter((href) => href !== null && href !== undefined);
    assert.ok(
      item.children === undefined || links.length > 1,
      `${item.id}: one-link panel`,
    );
  }
});
