import assert from "node:assert/strict";
import test from "node:test";
import { assertWithheldForNonPublishedStatuses } from "../shared/status-test-cases";
import type { Navigation } from "../../payload-types";
import { mapPayloadNavigation } from "./payload-navigation-mapper";

const now = new Date("2026-10-28T12:00:00Z");

// Loose fixtures with a cast keep compiling when the global grows fields.
function navigation(overrides: Record<string, unknown>): Navigation {
  return {
    id: "navigation",
    _status: "published",
    headerItems: [],
    footerGroups: [],
    enHeader: [],
    enFooter: [],
    ...overrides,
  } as Navigation;
}

const publishedPage = {
  id: "page-1",
  slug: "kaynaklar",
  language: "tr",
  pageType: "standard",
  _status: "published",
  publishedAt: "2026-10-01T00:00:00Z",
};

test("an unpublished global yields no navigation", () => {
  assert.equal(
    mapPayloadNavigation(navigation({ _status: "draft" }), "tr", now),
    null,
  );
});

test("header links resolve pages, internal paths and drop unsafe or inactive items", () => {
  const mapped = mapPayloadNavigation(
    navigation({
      headerItems: [
        { id: "h1", label: "Kaynaklar", linkType: "page", page: publishedPage },
        {
          id: "h2",
          label: "Taslak sayfa",
          linkType: "page",
          page: { ...publishedPage, _status: "draft" },
        },
        {
          id: "h3",
          label: "Gelecek",
          linkType: "page",
          page: { ...publishedPage, publishedAt: "2026-12-01T00:00:00Z" },
        },
        {
          id: "h4",
          label: "Makaleler",
          linkType: "internal",
          internalPath: "/makaleler",
        },
        {
          id: "h5",
          label: "Kötü",
          linkType: "internal",
          internalPath: "//evil.example",
        },
        {
          id: "h6",
          label: "Pasif",
          linkType: "internal",
          internalPath: "/x",
          active: false,
        },
        {
          id: "h7",
          label: "Geri bildirim",
          linkType: "internal",
          internalPath: "/geri-bildirim",
        },
        {
          id: "h8",
          label: "Dış",
          linkType: "external",
          externalUrl: "https://example.org/a",
          newTab: true,
        },
        {
          id: "h9",
          label: "Eposta",
          linkType: "external",
          externalUrl: "mailto:a@b.co",
        },
      ],
    }),
    "tr",
    now,
  );

  assert.deepEqual(
    mapped?.headerItems.map((item) => [item.id, item.href, item.newTab]),
    [
      ["h1", "/kaynaklar", false],
      ["h4", "/makaleler", false],
      ["h8", "https://example.org/a", true],
    ],
  );
});

test("footer links may use mailto and tel; empty groups are dropped", () => {
  const mapped = mapPayloadNavigation(
    navigation({
      enFooter: [
        {
          id: "g1",
          title: "Contact",
          links: [
            {
              id: "l1",
              label: "Mail",
              linkType: "external",
              externalUrl: "mailto:saban@sabandurali.com",
            },
            {
              id: "l2",
              label: "Phone",
              linkType: "external",
              externalUrl: "tel:+90 212 000 00 00",
            },
            {
              id: "l3",
              label: "Script",
              linkType: "external",
              externalUrl: "javascript:alert(1)",
            },
          ],
        },
        { id: "g2", title: "Empty", links: [] },
        {
          id: "g3",
          title: "Inactive",
          active: false,
          links: [
            { id: "l4", label: "x", linkType: "internal", internalPath: "/en" },
          ],
        },
      ],
    }),
    "en",
    now,
  );

  assert.deepEqual(
    mapped?.footerGroups.map((group) => [
      group.id,
      group.links.map((item) => item.href),
    ]),
    [["g1", ["mailto:saban@sabandurali.com", "tel:+90 212 000 00 00"]]],
  );
});

test("TESTS-INFRA-2: only the exact published status is public", () => {
  assertWithheldForNonPublishedStatuses((_status) =>
    mapPayloadNavigation(navigation({ _status }), "tr", now),
  );
});

test("CORRECTNESS-2: a link to the legacy ana-sayfa record points at /", () => {
  const mapped = mapPayloadNavigation(
    navigation({
      headerItems: [
        {
          id: "h1",
          label: "Ana sayfa",
          linkType: "page",
          page: { ...publishedPage, slug: "ana-sayfa" },
        },
      ],
    }),
    "tr",
    now,
  );

  assert.deepEqual(
    mapped?.headerItems.map((item) => item.href),
    ["/"],
  );
});
