import { contactPaths, getAbsoluteUrl, homeUrls } from "@/config/site";
import {
  createBreadcrumbJsonLd,
  createHomeTrail,
} from "@/content/breadcrumb-seo";
import { siteLocales, type SiteLocale } from "@/content/locales";
import { searchPaths, searchQueryParam } from "@/content/search/search-routes";

export const personalBrandName = "Şaban Durali";
export const websiteEntityId = `${homeUrls["tr-TR"]}#website`;
export const personEntityId = `${homeUrls["tr-TR"]}#person`;
export const profilePageEntityId = getAbsoluteUrl("/hakkimda#profile");

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

/**
 * Inline reference to the site as a WebSite, for `isPartOf` of a content
 * page. Like the person reference it repeats the name and URL next to the
 * shared `@id`, which the home page defines.
 */
export function createWebsiteReference() {
  return {
    "@type": "WebSite",
    "@id": websiteEntityId,
    name: personalBrandName,
    url: homeUrls["tr-TR"],
  } as const;
}

/**
 * An ImageObject for a content image: its absolute URL and, only when the
 * source states them, its pixel size. No size is guessed.
 */
export function createImageObject(image: {
  src: string;
  width?: number;
  height?: number;
}) {
  const sized =
    image.width !== undefined &&
    image.height !== undefined &&
    Number.isFinite(image.width) &&
    Number.isFinite(image.height) &&
    image.width > 0 &&
    image.height > 0;
  return {
    "@type": "ImageObject",
    url: getAbsoluteUrl(image.src),
    ...(sized ? { width: image.width, height: image.height } : {}),
  };
}

export function createPersonEntity(locale: SiteLocale = "tr") {
  return {
    ...createPersonReference(),
    image: getAbsoluteUrl("/brand/saban-durali-profile.jpg"),
    knowsAbout: [...personKnowsAbout[locale]],
    ...(personProfileUrls.length > 0 ? { sameAs: [...personProfileUrls] } : {}),
  };
}

/**
 * The site as one WebSite entity in both languages, with the site search
 * of each language as a SearchAction.
 */
export function createWebsiteEntity() {
  return {
    ...createWebsiteReference(),
    alternateName: "sabandurali.com",
    inLanguage: ["tr-TR", "en"],
    publisher: { "@id": personEntityId },
    potentialAction: siteLocales.map((locale) => ({
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getAbsoluteUrl(searchPaths[locale])}?${searchQueryParam}={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    })),
  };
}

/**
 * The home page graph of both languages: the WebSite and its owner. The
 * owner's profile page is /hakkimda (`createAboutPageJsonLd`).
 */
export function createHomeEntityJsonLd(locale: SiteLocale) {
  return {
    "@context": "https://schema.org",
    "@graph": [createWebsiteEntity(), createPersonEntity(locale)] as const,
  };
}

/** The visible names of the about and contact pages (their breadcrumbs). */
export const aboutPageName = "Hakkımda";
export const aboutPagePath = "/hakkimda";
export const contactPageNames = {
  tr: "İletişim",
  en: "Contact",
} as const satisfies Record<SiteLocale, string>;

/**
 * /hakkimda as the owner's ProfilePage: the Person (with the published
 * subjects and the confirmed profiles only) is its main entity.
 */
export function createAboutPageJsonLd() {
  const url = getAbsoluteUrl(aboutPagePath);
  const breadcrumb = createBreadcrumbJsonLd(
    createHomeTrail("tr", { name: aboutPageName, path: aboutPagePath }),
  );
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": profilePageEntityId,
        url,
        name: `${aboutPageName} | ${personalBrandName}`,
        inLanguage: "tr-TR",
        isPartOf: createWebsiteReference(),
        breadcrumb: { "@id": breadcrumb["@id"] },
        mainEntity: createPersonEntity("tr"),
      },
      breadcrumb,
    ] as const,
  };
}

/** The contact page of `locale` as a ContactPage about the owner. */
export function createContactPageJsonLd(locale: SiteLocale) {
  const path = contactPaths[locale];
  const url = getAbsoluteUrl(path);
  const breadcrumb = createBreadcrumbJsonLd(
    createHomeTrail(locale, { name: contactPageNames[locale], path }),
  );
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": url,
        url,
        name: `${contactPageNames[locale]} | ${personalBrandName}`,
        inLanguage: locale === "tr" ? "tr-TR" : "en",
        isPartOf: createWebsiteReference(),
        breadcrumb: { "@id": breadcrumb["@id"] },
        about: createPersonReference(),
      },
      breadcrumb,
    ] as const,
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
