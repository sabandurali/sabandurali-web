import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
import { mapPayloadNavigation } from "@/content/navigation/payload-navigation-mapper";
import type { PublicNavigation } from "@/content/navigation/public-types";
import type { Locale } from "@/content/homeContent";

export class PayloadPublicNavigationRepository {
  /**
   * The Navigation global is readable by admins and editors only, so the
   * anonymous REST API never exposes its configuration. The site reads it
   * server-side with overrideAccess, but only the published version
   * (draft: false), and the mapper only passes on published, active and
   * safe links.
   */
  async findPublished(language: Locale): Promise<PublicNavigation | null> {
    const payload = await getPayload({ config });
    const navigation = await payload.findGlobal({
      slug: "navigation",
      depth: 1,
      draft: false,
      fallbackLocale: false,
      locale: language,
      overrideAccess: true,
    });

    return mapPayloadNavigation(navigation, language);
  }
}
