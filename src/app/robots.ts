import type { MetadataRoute } from "next";
import { getAbsoluteUrl, siteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: getAbsoluteUrl("/sitemap.xml"),
    host: siteUrl,
  };
}
