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
  compact?: boolean;
};

export default async function Header({
  locale,
  anchors,
  content,
  homeHref = "#top",
  anchorPrefix = "",
  languageHrefs,
  compact = false,
}: HeaderProps) {
  const items = await getHeaderNavigation(
    locale,
    anchors,
    content,
    anchorPrefix,
  );

  return (
    <header className="border-b border-[var(--accent-border-soft)] bg-background">
      <div className={`relative mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-1.5 sm:px-6 min-[1360px]:px-8 2xl:px-10 ${compact ? "min-h-[50px] min-[1360px]:min-h-[52px]" : "min-h-[62px] py-2 min-[1360px]:min-h-[68px]"}`}>
        <a
          href={homeHref}
          className="flex shrink-0 items-center gap-3 min-[1360px]:min-w-0 min-[1360px]:shrink min-[1360px]:gap-3.5"
        >
          <Image
            src="/brand/sd-monogram-light.png"
            alt="Şaban Durali"
            width={606}
            height={669}
            className={`${compact ? "h-7 min-[1360px]:h-8" : "h-9 min-[1360px]:h-10"} w-auto shrink-0 object-contain`}
            priority
          />
          <span aria-hidden="true" className="min-[1360px]:min-w-0">
            <span className="block whitespace-nowrap font-serif text-sm font-semibold tracking-[0.1em] text-ivory min-[1360px]:text-[1.02rem] min-[1360px]:uppercase min-[1360px]:tracking-[0.16em]">
              <span className="min-[1360px]:hidden">{content.mobileBrandName}</span>
              <span className="hidden min-[1360px]:inline">{content.brandName}</span>
            </span>
            <span className="mt-1 hidden whitespace-nowrap text-[8px] font-medium uppercase tracking-[0.16em] text-accent-soft min-[1360px]:block">
              {content.brandTagline}
            </span>
          </span>
        </a>

        <nav
          aria-label={content.menu.desktopNavigationLabel}
          className="hidden min-w-0 flex-1 items-center justify-center text-xs text-ivory min-[1360px]:flex"
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
