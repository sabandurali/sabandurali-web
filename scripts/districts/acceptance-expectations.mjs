// Pure expectations shared by the local district acceptance scripts
// (scripts/districts/acceptance.mjs, scripts/content-trust-routes.mjs).
// Tested in acceptance-expectations.test.mjs.

/** Section ids of the district guide in page order (docs/PROJECT-STATE.md §H). */
export const guideSections = [
  "genel-bakis",
  "tarihce",
  "tani",
  "yasam",
  "mahalleler",
  "gayrimenkul",
  "imar",
  "saha",
  "kareler",
  "kimlik",
  "arastirmalar",
  "haberler",
  "kaynaklar",
  "guncelleme",
];
export const conditionalSections = new Set(["arastirmalar", "haberler"]);

/** The contract applied to the ids a page actually rendered. */
export function expectedSectionIds(actualIds) {
  return guideSections.filter(
    (id) => !conditionalSections.has(id) || actualIds.includes(id),
  );
}

/**
 * Whether district guides are expected to be indexable. A static build has
 * no published guide, so every district page is an empty placeholder
 * (`noindex, follow`) and stays out of the sitemap. Only a build that serves
 * the editorial content (DISTRICT_EXPECT_EDITORIAL=1) expects indexable pages.
 */
export function expectsIndexedGuides(env = process.env) {
  return env.DISTRICT_EXPECT_EDITORIAL === "1";
}

/** Checks a robots meta value against the expectation; returns an error or null. */
export function robotsProblem(content, indexed) {
  const tokens = String(content ?? "")
    .toLowerCase()
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
  if (tokens.includes("nofollow")) return `unexpected nofollow: ${content}`;
  if (indexed && tokens.includes("noindex"))
    return `expected indexable, got ${content}`;
  if (!indexed && !(tokens.includes("noindex") && tokens.includes("follow")))
    return `expected "noindex, follow", got ${content}`;
  return null;
}

/** Whether the sitemap XML lists the guide of a district. */
export function sitemapListsDistrict(
  xml,
  slug,
  origin = "https://www.sabandurali.com",
) {
  return xml.includes(`<loc>${origin}/istanbul/ilceler/${slug}</loc>`);
}

/** Decodes the HTML entities that can appear in an attribute value. */
export function decodeAttribute(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

/**
 * The local URL of an og:image: the production origin is replaced by the
 * local server, and the query string (the `/_next/image?url=…&w=…&q=…`
 * parameters) is kept.
 */
export function localImageUrl(base, ogImage) {
  const url = new URL(decodeAttribute(ogImage));
  return `${base}${url.pathname}${url.search}`;
}

/** Text without soft hyphens (U+00AD), which long plate titles carry. */
export function withoutSoftHyphens(text) {
  return String(text).replaceAll("­", "");
}
