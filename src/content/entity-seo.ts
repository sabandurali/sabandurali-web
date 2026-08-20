import { getAbsoluteUrl, homeUrls } from "@/config/site";

export const personalBrandName = "Şaban Durali";
export const websiteEntityId = `${homeUrls["tr-TR"]}#website`;
export const personEntityId = `${homeUrls["tr-TR"]}#person`;
export const profilePageEntityId = `${homeUrls["tr-TR"]}#profile`;

export function createPersonEntity() {
  return {
    "@type": "Person",
    "@id": personEntityId,
    name: personalBrandName,
    url: homeUrls["tr-TR"],
    image: getAbsoluteUrl("/brand/saban-durali-profile.jpg"),
  };
}

export function createHomeEntityJsonLd(locale: "tr" | "en") {
  const person = createPersonEntity();

  return {
    "@context": "https://schema.org",
    "@graph": [
      ...(locale === "tr"
        ? [
            {
              "@type": "WebSite",
              "@id": websiteEntityId,
              name: personalBrandName,
              alternateName: "sabandurali.com",
              url: homeUrls["tr-TR"],
              publisher: { "@id": personEntityId },
            },
            {
              "@type": "ProfilePage",
              "@id": profilePageEntityId,
              url: homeUrls["tr-TR"],
              mainEntity: { "@id": personEntityId },
            },
          ]
        : []),
      person,
    ],
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
