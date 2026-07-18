import type { MetadataRoute } from "next";
import { contactUrls, homeUrls, privacyUrls } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const alternates = {
    languages: homeUrls,
  };
  const contactAlternates = {
    languages: contactUrls,
  };
  const privacyAlternates = {
    languages: privacyUrls,
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
    {
      url: contactUrls.tr,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: contactAlternates,
    },
    {
      url: contactUrls.en,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: contactAlternates,
    },
    {
      url: privacyUrls.tr,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
      alternates: privacyAlternates,
    },
    {
      url: privacyUrls.en,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
      alternates: privacyAlternates,
    },
  ];
}
