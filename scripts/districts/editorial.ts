import { createHash } from "node:crypto";
import type { DistrictGuide } from "../../src/payload-types";
import {
  sectionIsPublic,
  type DistrictSection,
  type DistrictSource,
} from "../../src/content/districts/district-content-policy";
import type { ResearchBundle } from "./import-core";

type TextSection = Exclude<
  DistrictSection,
  "facts" | "neighborhoods" | "marketData" | "planningDevelopments"
>;
export type EditorialRecord = {
  district: string;
  pdfSha256: string;
  checkedAt: string;
  sections: Partial<Record<TextSection, string>>;
  neighborhoods: string[];
  sources: DistrictSource[];
  excluded: Record<string, string>;
  methodology: string;
};
export type EditorialBundle = {
  schemaVersion: 1;
  districts: EditorialRecord[];
};
export function attachEditorial(
  research: ResearchBundle,
  editorial: EditorialBundle,
) {
  if (
    editorial.schemaVersion !== 1 ||
    editorial.districts.length !== 39 ||
    new Set(editorial.districts.map((r) => r.district)).size !== 39
  )
    throw new Error("Exactly 39 unique editorial reviews required.");
  for (const row of research.districts) {
    const review = editorial.districts.find((r) => r.district === row.district);
    if (!review || review.pdfSha256 !== row.document.sha256)
      throw new Error(`Editorial/PDF mismatch: ${row.district}`);
    const reviewed = Object.keys(review.sections) as DistrictSection[];
    if (review.neighborhoods.length) reviewed.push("neighborhoods");
    for (const section of ["summary", "history", "geography"] as const)
      if (!review.sections[section]?.trim())
        throw new Error(`Missing core editorial: ${row.district}/${section}`);
    for (const section of reviewed)
      if (!sectionIsPublic(section, reviewed, review.sources))
        throw new Error(`Unsupported editorial: ${row.district}/${section}`);
    if (
      !review.methodology ||
      !Object.keys(review.excluded).length ||
      new Set(review.neighborhoods).size !== review.neighborhoods.length
    )
      throw new Error(`Incomplete editorial review: ${row.district}`);
    row.editorial = review;
  }
  return research;
}
export function editorialFields(
  review: EditorialRecord,
): Partial<DistrictGuide> {
  const sections = Object.keys(review.sections) as DistrictSection[];
  if (review.neighborhoods.length) sections.push("neighborhoods");
  return {
    ...review.sections,
    neighborhoods: review.neighborhoods.map((name) => ({
      name,
      featured: false,
    })),
    sources: review.sources,
    reviewedSections: sections,
    researchNotes: JSON.stringify(
      {
        methodology: review.methodology,
        checkedAt: review.checkedAt,
        excluded: review.excluded,
        reviewSha256: createHash("sha256")
          .update(JSON.stringify(review))
          .digest("hex"),
        rawResearch:
          "data/districts/research.json; public dışı araştırma havuzu",
      },
      null,
      2,
    ),
  };
}
