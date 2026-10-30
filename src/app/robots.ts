import type { MetadataRoute } from "next";
import { getAbsoluteUrl, siteUrl } from "@/config/site";

/**
 * The CMS admin and the REST API are not content: crawlers are kept out of
 * both. Uploaded media (`/api/media/file/…`) is the exception, because
 * pages, Open Graph tags and the sitemap's image entries point at it.
 * The longest matching rule wins, so the narrower `allow` beats `/api/`.
 */
const robotsDisallow = ["/admin", "/api/"] as const;
const robotsAllow = ["/", "/api/media/file/"] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [...robotsAllow],
      disallow: [...robotsDisallow],
    },
    sitemap: getAbsoluteUrl("/sitemap.xml"),
    host: siteUrl,
  };
}
