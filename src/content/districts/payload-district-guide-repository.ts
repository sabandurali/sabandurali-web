import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
import {
  projectPublishedDistrictGuide,
  type DistrictGuide,
} from "./district-guide-projection";
import {
  DISTRICT_GUIDE_SORT,
  publishedDistrictGuidesWhere,
} from "./district-guide-queries";

/** Fields the public summary projection reads (`getSummaries`). */
const SUMMARY_SELECT = {
  district: true,
  summary: true,
  reviewedSections: true,
  sources: true,
  publishedAt: true,
  _status: true,
} as const;

type FindOptions = {
  now: Date;
  district?: string;
  select?: typeof SUMMARY_SELECT;
};

/**
 * Public reads of district guides through the Payload Local API. Every query
 * goes through `find`, so the access options (anonymous access, published
 * version, Turkish locale without fallback, no population) are written once.
 * Documents leave this class only as public projections.
 */
export class PayloadPublicDistrictGuideRepository {
  private async find({ now, district, select }: FindOptions) {
    const payload = await getPayload({ config });

    return payload.find({
      collection: "district-guides",
      depth: 0,
      draft: false,
      fallbackLocale: false,
      locale: "tr",
      overrideAccess: false,
      pagination: false,
      sort: DISTRICT_GUIDE_SORT,
      where: publishedDistrictGuidesWhere(now, district),
      ...(district === undefined ? {} : { limit: 1 }),
      ...(select === undefined ? {} : { select }),
    });
  }

  async findPublished(
    district: string,
    now: Date = new Date(),
  ): Promise<DistrictGuide | null> {
    const result = await this.find({ now, district });
    const document = result.docs[0];

    return document === undefined
      ? null
      : projectPublishedDistrictGuide(document, now.getTime());
  }

  /** Every published guide, keyed by district, in one query. */
  async listPublished(
    now: Date = new Date(),
  ): Promise<Map<string, DistrictGuide>> {
    const result = await this.find({ now });
    const guides = new Map<string, DistrictGuide>();

    for (const document of result.docs) {
      const guide = projectPublishedDistrictGuide(document, now.getTime());
      if (typeof document.district === "string" && guide !== null) {
        guides.set(document.district, guide);
      }
    }

    return guides;
  }

  /** Public summaries of every published guide, selecting only their inputs. */
  async listSummaries(now: Date = new Date()): Promise<Map<string, string>> {
    const result = await this.find({ now, select: SUMMARY_SELECT });
    const summaries = new Map<string, string>();

    for (const document of result.docs) {
      const summary = projectPublishedDistrictGuide(
        document,
        now.getTime(),
      )?.summary;
      if (typeof document.district === "string" && summary) {
        summaries.set(document.district, summary);
      }
    }

    return summaries;
  }
}
