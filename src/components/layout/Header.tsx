import {
  homeContent,
  type HeaderContent,
  type HomeAnchors,
  type Locale,
} from "@/content/homeContent";
import { getHeaderNavigation } from "@/content/navigation/navigation-data-source";
import Container from "@/components/ui/Container";
import {
  DesktopLanguageSwitcher,
  DesktopNavigation,
  MobileNavigation,
} from "./HeaderNavigation";
import Wordmark from "./Wordmark";

type HeaderProps = {
  locale: Locale;
  /** Defaults to the locale's home anchors. */
  anchors?: HomeAnchors;
  /** Defaults to the locale's header texts. */
  content?: HeaderContent;
  /** Prefix of the English home-section links ("/en" off the home page). */
  anchorPrefix?: string;
  /** This page in each language; the home pages otherwise. */
  languageHrefs?: Partial<Record<Locale, string>>;
  /**
   * @deprecated The wordmark always links to the locale's home page;
   * kept so existing pages compile.
   */
  homeHref?: string;
  /** @deprecated The atlas header has one size; kept so pages compile. */
  compact?: boolean;
};

/**
 * Atlas header: the ŞABAN DURALİ wordmark (home link) and the language
 * switcher on the first row, the navigation bar below it from 1280 px, and
 * a "Menü" disclosure with the same links on narrower screens. The page,
 * not the header, owns `<main id="main">`; the root layout's SkipLink is
 * the first focusable element above it.
 */
export default async function Header({
  locale,
  anchors = homeContent[locale].anchors,
  content = homeContent[locale].header,
  anchorPrefix = "",
  languageHrefs,
}: HeaderProps) {
  const items = await getHeaderNavigation(
    locale,
    anchors,
    content,
    anchorPrefix,
  );

  return (
    <header className="relative border-b-2 border-ink bg-paper text-ink">
      <Container className="flex min-h-18 items-center justify-between gap-4 py-2.5">
        <Wordmark
          locale={locale}
          name={content.brandName}
          tagline={content.brandTagline}
        />
        <div className="flex items-center gap-3">
          <DesktopLanguageSwitcher
            locale={locale}
            languageLabel={content.languageSwitcherLabel}
            languageHrefs={languageHrefs}
          />
          <MobileNavigation
            locale={locale}
            items={items}
            mobileNavigationLabel={content.menu.navigationLabel}
            languageLabel={content.languageSwitcherLabel}
            languageHrefs={languageHrefs}
          />
        </div>
      </Container>
      <DesktopNavigation
        locale={locale}
        items={items}
        navigationLabel={content.menu.desktopNavigationLabel}
      />
    </header>
  );
}
