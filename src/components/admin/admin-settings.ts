import type { Config } from "payload";
import { en } from "payload/i18n/en";
import { tr } from "payload/i18n/tr";

/**
 * Admin interface language (ADM-I18N). Field labels, descriptions and
 * validation messages in the collections are Turkish, so Payload's own
 * buttons, menus and error messages are Turkish too. English stays
 * selectable in the account settings; a browser that asks for any other
 * language gets Turkish.
 */
export const ADMIN_I18N = {
  fallbackLanguage: "tr",
  supportedLanguages: { en, tr },
} satisfies NonNullable<Config["i18n"]>;

/** Appended to every admin page title: "Makaleler – Şaban Durali Yönetim". */
export const ADMIN_TITLE_SUFFIX = "– Şaban Durali Yönetim";

/**
 * Admin `<head>` metadata. The admin is never indexed, and Payload's
 * dynamic Open Graph image endpoint (`/api/og`, an unauthenticated image
 * renderer) is turned off: admin links are not shared publicly.
 */
export const ADMIN_META = {
  defaultOGImageType: "off",
  description: "sabandurali.com içerik yönetim paneli.",
  openGraph: {
    description: "sabandurali.com içerik yönetim paneli.",
    siteName: "Şaban Durali Yönetim",
    title: "Şaban Durali Yönetim",
  },
  robots: { follow: false, index: false },
  titleSuffix: ADMIN_TITLE_SUFFIX,
} satisfies NonNullable<NonNullable<Config["admin"]>["meta"]>;
