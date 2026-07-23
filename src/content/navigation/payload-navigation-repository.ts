import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
import { mapPayloadNavigation } from "@/content/navigation/payload-navigation-mapper";
import type { PublicNavigation } from "@/content/navigation/public-types";

export class PayloadPublicNavigationRepository {
  async findPublished(): Promise<PublicNavigation | null> {
    const payload = await getPayload({ config });
    const navigation = await payload.findGlobal({
      slug: "navigation",
      depth: 1,
      draft: false,
      overrideAccess: true,
    });

    return mapPayloadNavigation(navigation);
  }
}
