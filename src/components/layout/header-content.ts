import type { SiteLocale } from "@/content/locales";
import { isTranslationPath } from "@/content/route-parity";

/**
 * Texts and links of the site shell (header, footer, 404 and error pages)
 * that are not editorial content.
 */
export type HeaderLocale = SiteLocale;

export const localeHomePaths = {
  tr: "/",
  en: "/en",
} as const satisfies Record<HeaderLocale, string>;

type ShellStrings = {
  /** Visible label of the mobile menu button. */
  menu: string;
  /** Appended to the wordmark for assistive technology. */
  homeLink: string;
  backToTop: string;
};

const shellStrings: Record<HeaderLocale, ShellStrings> = {
  tr: { menu: "Menü", homeLink: "ana sayfa", backToTop: "Sayfanın başına dön" },
  en: { menu: "Menu", homeLink: "home page", backToTop: "Back to top" },
};

export function getShellStrings(locale: HeaderLocale): ShellStrings {
  return shellStrings[locale];
}

export type LanguageOption = {
  locale: HeaderLocale;
  code: string;
  /** The language's name in that language. */
  name: string;
  /** Same value as the `lang` of that language's pages (`<html lang>`). */
  hrefLang: string;
  href: string;
  current: boolean;
  /**
   * The link opens this page's translation. False when the page has no
   * counterpart in that language and the link falls back to its home or
   * list page; the switcher then shows `untranslatedNote`.
   */
  translated: boolean;
  /** Visible note for an untranslated link, written in the link's language. */
  untranslatedNote: string;
};

const languages = [
  {
    locale: "tr",
    code: "TR",
    name: "Türkçe",
    hrefLang: "tr",
    untranslatedNote: "Yalnızca İngilizce",
  },
  {
    locale: "en",
    code: "EN",
    name: "English",
    hrefLang: "en",
    untranslatedNote: "Only in Turkish",
  },
] as const;

/**
 * The language links of a page: the page's own path per language when it
 * has one, otherwise that language's home page. `translated` comes from the
 * route parity manifest (src/content/route-parity.ts).
 */
export function getLanguageOptions(
  locale: HeaderLocale,
  hrefs?: Partial<Record<HeaderLocale, string>>,
): LanguageOption[] {
  const ownPath = hrefs?.[locale] ?? localeHomePaths[locale];
  return languages.map((language) => {
    const href = hrefs?.[language.locale] ?? localeHomePaths[language.locale];
    return {
      ...language,
      href,
      current: language.locale === locale,
      translated: isTranslationPath(ownPath, locale, href, language.locale),
    };
  });
}
