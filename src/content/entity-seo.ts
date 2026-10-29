import { getAbsoluteUrl, homeUrls } from "@/config/site";
import type { SiteLocale } from "@/content/locales";

export const personalBrandName = "Şaban Durali";
export const websiteEntityId = `${homeUrls["tr-TR"]}#website`;
export const personEntityId = `${homeUrls["tr-TR"]}#person`;
export const profilePageEntityId = `${homeUrls["tr-TR"]}#profile`;

/**
 * Public profiles of Şaban Durali for `sameAs`. Only add a URL the owner has
 * confirmed as his own profile; `sameAs` is omitted while the list is empty.
 */
export const personProfileUrls: readonly string[] = [];

/**
 * Subjects the published biography names (src/content/biography.ts): finance
 * and accounting since 1996, Istanbul and real estate research, and the
 * platform's research, AI, sales and negotiation work.
 */
const personKnowsAbout = {
  tr: [
    "İstanbul",
    "Gayrimenkul",
    "Araştırma ve analiz",
    "Yapay zekâ ve teknoloji",
    "Satış ve müzakere",
    "Muhasebe ve finans",
  ],
  en: [
    "Istanbul",
    "Real estate",
    "Research and analysis",
    "Artificial intelligence and technology",
    "Sales and negotiation",
    "Accounting and finance",
  ],
} as const satisfies Record<SiteLocale, readonly string[]>;

/**
 * Inline reference to the site owner for `author` and similar properties.
 * Google does not resolve `@id` across pages, so the name and URL are always
 * included next to the shared `@id`.
 */
export function createPersonReference() {
  return {
    "@type": "Person",
    "@id": personEntityId,
    name: personalBrandName,
    url: homeUrls["tr-TR"],
  } as const;
}

export function createPersonEntity(locale: SiteLocale = "tr") {
  return {
    ...createPersonReference(),
    image: getAbsoluteUrl("/brand/saban-durali-profile.jpg"),
    knowsAbout: [...personKnowsAbout[locale]],
    ...(personProfileUrls.length > 0 ? { sameAs: [...personProfileUrls] } : {}),
  };
}

export function createHomeEntityJsonLd(locale: SiteLocale) {
  const person = createPersonEntity(locale);

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
