import assert from "node:assert/strict";
import test from "node:test";
import { getStaticFooterGroups } from "../../components/layout/navigation";
import { contactPaths, privacyPaths } from "../../config/site";
import { homeContent } from "../homeContent";
import { resolveFooterGroups } from "./navigation-fallback";
import type { PublicFooterGroup } from "./public-types";

function link(id: string, href: string) {
  return { id, label: id, href, external: false, newTab: false, children: [] };
}

for (const locale of ["tr", "en"] as const) {
  const staticGroups = getStaticFooterGroups(homeContent[locale].footer);
  const required = [privacyPaths[locale], contactPaths[locale]];

  test(`${locale}: an unpublished or empty CMS footer falls back to the static footer`, () => {
    assert.deepEqual(
      resolveFooterGroups(null, staticGroups, required),
      staticGroups,
    );
    assert.deepEqual(
      resolveFooterGroups([], staticGroups, required),
      staticGroups,
    );
  });

  test(`${locale}: privacy and contact links are always present`, () => {
    const cms: PublicFooterGroup[] = [
      { id: "cms", title: "Bağlantılar", links: [link("blog", "/makaleler")] },
    ];
    const groups = resolveFooterGroups(cms, staticGroups, required);
    const hrefs = groups.flatMap((group) => group.links.map((l) => l.href));

    assert.equal(groups[0], cms[0]);
    assert.ok(hrefs.includes(privacyPaths[locale]));
    assert.ok(hrefs.includes(contactPaths[locale]));
    // The e-mail link is static-only and not required.
    assert.equal(
      hrefs.some((href) => href?.startsWith("mailto:")),
      false,
    );
  });

  test(`${locale}: a complete CMS footer is used as it is`, () => {
    const cms: PublicFooterGroup[] = [
      {
        id: "cms",
        title: null,
        links: [
          link("privacy", privacyPaths[locale]),
          link("contact", contactPaths[locale]),
        ],
      },
    ];

    assert.deepEqual(resolveFooterGroups(cms, staticGroups, required), cms);
  });
}
