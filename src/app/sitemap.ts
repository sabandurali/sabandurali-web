import type { MetadataRoute } from "next";
import { homeUrls } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const alternates = {
    languages: homeUrls,
  };
  const lastModified = new Date();

  return [
    {
      url: homeUrls["tr-TR"],
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      alternates,
    },
    {
      url: homeUrls.en,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates,
    },
  ];
}
