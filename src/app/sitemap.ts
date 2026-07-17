import type { MetadataRoute } from "next";
import { homeUrls } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const alternates = {
    languages: homeUrls,
  };

  return [
    {
      url: homeUrls.tr,
      alternates,
    },
    {
      url: homeUrls.en,
      alternates,
    },
  ];
}
