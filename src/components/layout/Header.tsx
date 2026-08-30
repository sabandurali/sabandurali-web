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
    <header className="border-b border-border bg-background">
      <div className="relative mx-auto flex min-h-[68px] max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 xl:min-h-[78px] xl:py-3 xl:px-8 2xl:px-10">
        <a
          href={homeHref}
          className="flex shrink-0 items-center gap-2.5 xl:min-w-0 xl:shrink xl:gap-3"
        >
          <Image
            src="/brand/sd-monogram-light.png"
            alt="Şaban Durali"
            width={606}
            height={669}
            className="h-9 w-auto shrink-0 object-contain xl:h-10"
            priority
          />
          <span aria-hidden="true" className="xl:min-w-0">
            <span className="block whitespace-nowrap font-serif text-sm font-semibold tracking-[0.08em] text-ivory xl:text-base xl:uppercase xl:tracking-[0.14em]">
              <span className="min-[1400px]:hidden">{content.mobileBrandName}</span>
              <span className="hidden min-[1400px]:inline">{content.brandName}</span>
            </span>
          </span>
        </a>

        <nav
          aria-label={content.menu.desktopNavigationLabel}
          className="hidden min-w-0 flex-1 items-center justify-center text-xs text-ivory xl:flex"
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
