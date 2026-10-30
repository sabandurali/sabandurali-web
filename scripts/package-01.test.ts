import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { contactEmail, siteSocialImage } from "../src/config/site";
import {
  getEnglishHeaderNavigationItems,
  getStaticFooterGroups,
} from "../src/content/navigation/static-navigation";
import { homeContent } from "../src/content/homeContent";
import { privacyContent } from "../src/content/privacyContent";
import { createPublicPageMetadata } from "../src/content/pages/page-seo";
import type { PublicPage } from "../src/content/pages/public-types";

function page(
  language: "tr" | "en",
  socialImage: PublicPage["seo"]["socialImage"],
): PublicPage {
  return {
    id: "fixture-home",
    title: "Fixture Home",
    slug: "home",
    language,
    pageType: "home",
    summary: "",
    layout: [],
    publishedAt: "2026-10-01T00:00:00Z",
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
    seo: {
      title: "Fixture SEO",
      description: "Fixture description",
      index: true,
      follow: true,
      socialImage,
    },
  };
}

for (const language of ["tr", "en"] as const) {
  test(`${language}: corporate footer and both privacy addresses use the central email`, () => {
    assert.equal(contactEmail, "saban@sabandurali.com");
    const links = getStaticFooterGroups(homeContent[language].footer).flatMap(
      (group) => group.links,
    );
    const email = links.find((link) => link.href?.startsWith("mailto:"));
    assert.equal(email?.href, `mailto:${contactEmail}`);
    assert.ok(email?.label.includes(contactEmail));
    const privacy = JSON.stringify(privacyContent[language]);
    assert.equal(privacy.split(contactEmail).length - 1, 2);
    // No personal mailbox may remain next to the corporate address.
    assert.doesNotMatch(privacy, /@gmail\.com/i);
  });

  test(`${language}: missing CMS image falls back for OG and Twitter without changing canonical`, () => {
    const metadata = createPublicPageMetadata(page(language, null));
    assert.deepEqual(metadata.openGraph?.images, [siteSocialImage]);
    assert.deepEqual(metadata.twitter?.images, [siteSocialImage]);
    assert.equal(
      metadata.alternates?.canonical,
      language === "tr"
        ? "https://www.sabandurali.com/"
        : "https://www.sabandurali.com/en",
    );
  });

  test(`${language}: custom CMS image and attribution are preserved for both share formats`, () => {
    const metadata = createPublicPageMetadata(
      page(language, {
        src: "/api/media/file/custom.jpg",
        alt: "Custom sharing image",
      }),
    );
    const expected = [
      {
        url: "https://www.sabandurali.com/api/media/file/custom.jpg",
        alt: "Custom sharing image",
      },
    ];
    assert.deepEqual(metadata.openGraph?.images, expected);
    assert.deepEqual(metadata.twitter?.images, expected);
  });
}

test("English research navigation never targets the conditional home section", () => {
  const items = getEnglishHeaderNavigationItems();
  const research = items.find((item) => item.id === "research-analysis");
  assert.equal(research?.href, "/en/articles");
  assert.deepEqual(research?.children, []);
  assert.equal(JSON.stringify(items).includes("#son-arastirmalar"), false);
  // NAV-EN-ANCHORS: the district atlas section of the English home page.
  const realEstate = items.find((item) => item.id === "real-estate-istanbul");
  assert.equal(realEstate?.href, "/en#istanbul");
});

test("shared OG asset is a valid 1200 × 630 JPEG", async () => {
  const metadata = await sharp("public/brand/site-og.jpg").metadata();
  assert.equal(metadata.format, "jpeg");
  assert.equal(metadata.width, 1200);
  assert.equal(metadata.height, 630);
});
