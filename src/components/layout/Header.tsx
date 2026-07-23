import Image from "next/image";
import type {
  HeaderContent,
  HomeAnchors,
  Locale,
} from "@/content/homeContent";
import { getHeaderNavigation } from "@/content/navigation/navigation-data-source";
import HeaderNavigationLinks from "./HeaderNavigationLinks";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileMenu from "./MobileMenu";

type HeaderProps = {
  locale: Locale;
  anchors: HomeAnchors;
  content: HeaderContent;
  homeHref?: string;
  anchorPrefix?: string;
  languageHrefs?: Record<Locale, string>;
};

export default async function Header({
  locale,
  anchors,
  content,
  homeHref = "#top",
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
    <header className="border-b border-border bg-background/95">
      <div className="relative mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 md:min-h-[94px] md:py-4 lg:px-10">
        <a
          href={homeHref}
          className="flex shrink-0 items-center gap-2.5 md:min-w-0 md:shrink md:gap-3"
        >
          <Image
            src="/brand/sd-monogram-light.png"
            alt=""
            width={606}
            height={669}
            className="h-10 w-auto shrink-0 object-contain md:h-[50px]"
            priority
          />
          <span className="md:min-w-0">
            <span className="block whitespace-nowrap font-serif text-base font-semibold tracking-tight text-ivory md:text-xl md:uppercase md:tracking-[0.16em]">
              <span className="md:hidden">{content.mobileBrandName}</span>
              <span className="hidden md:inline">{content.brandName}</span>
            </span>
            <span className="hidden whitespace-nowrap text-[10px] tracking-[0.16em] text-accent-soft md:block">
              {content.brandTagline}
            </span>
          </span>
        </a>

        <nav
          aria-label={content.menu.desktopNavigationLabel}
          className="hidden items-center gap-5 text-sm text-ivory md:flex lg:gap-7"
        >
          <HeaderNavigationLinks
            items={items}
            variant="desktop"
          />
        </nav>

        <MobileMenu
          locale={locale}
          content={content}
          items={items}
          languageHrefs={languageHrefs}
        />

        <LanguageSwitcher
          locale={locale}
          label={content.languageSwitcherLabel}
          variant="desktop"
          hrefs={languageHrefs}
        />
      </div>
    </header>
  );
}
