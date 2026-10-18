// Explicit, manual refresh from the public published API only. Never load environment files.
import { writeFile } from "node:fs/promises";
const url =
  "https://www.sabandurali.com/api/district-guides?limit=100&depth=0&locale=tr&where%5B_status%5D%5Bequals%5D=published";
const response = await fetch(url, {
  signal: AbortSignal.timeout(30000),
  redirect: "error",
});
if (!response.ok) throw new Error(`Public snapshot HTTP ${response.status}`);
const body = await response.json();
if (body.totalDocs !== 39 || body.docs.length !== 39 || body.hasNextPage)
  throw new Error("Expected exactly 39 published guides");
const sections = [
  "summary",
  "geography",
  "history",
  "life",
  "transportation",
  "housingTexture",
  "regionalAssessment",
  "placesGuide",
  "distinctiveFeatures",
  "researchTopics",
];
function safeUrl(value) {
  try {
    const u = new URL(value);
    return (
      ["https:", "http:"].includes(u.protocol) &&
      !u.username &&
      !u.password &&
      !/^(localhost|127\.|10\.|192\.168\.|\[)/.test(u.hostname)
    );
  } catch {
    return false;
  }
}
const guides = body.docs
  .map((doc) => {
    if (
      doc._status !== "published" ||
      !/^[a-z-]+$/.test(doc.district) ||
      !Number.isFinite(Date.parse(doc.updatedAt))
    )
      throw new Error("Invalid published guide");
    return {
      slug: doc.district,
      url: `https://www.sabandurali.com/istanbul/ilceler/${doc.district}`,
      updatedAt: doc.updatedAt,
      publishedAt: doc.publishedAt,
      sections: Object.fromEntries(
        sections
          .filter(
            (key) =>
              doc.reviewedSections?.includes(key) &&
              typeof doc[key] === "string" &&
              doc[key].trim(),
          )
          .map((key) => [key, doc[key]]),
      ),
      sources: doc.sources.map((s, i) => {
        if (!safeUrl(s.url))
          throw new Error(`Unsafe source URL: ${doc.district} ${i}`);
        return {
          id: `${doc.district}-s${i + 1}`,
          title: s.title,
          publisher: s.publisher,
          url: s.url,
          sections: s.sections ?? [],
          checkedAt: s.checkedAt,
          dataDate: s.dataDate,
          needsVerification: s.needsVerification === true,
        };
      }),
    };
  })
  .sort((a, b) => a.slug.localeCompare(b.slug));
if (new Set(guides.map((g) => g.slug)).size !== 39)
  throw new Error("Duplicate district");
const snapshot = {
  retrievedAt: new Date().toISOString(),
  publicEndpoint: url,
  policy:
    "Public published editorial excerpts only; no database export, media, users, drafts or credentials. Source check dates are publisher metadata, not a new independent fact check. Numerical facts and marketData deliberately excluded.",
  guides,
};
await writeFile(
  new URL("../../src/content/assistant/public-guides.json", import.meta.url),
  JSON.stringify(snapshot, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    guides: guides.length,
    sources: guides.reduce((n, g) => n + g.sources.length, 0),
    updatedFrom: guides.map((g) => g.updatedAt).sort()[0],
    updatedTo: guides
      .map((g) => g.updatedAt)
      .sort()
      .at(-1),
  }),
);
