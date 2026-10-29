"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Container from "@/components/ui/Container";
import Disclosure from "@/components/ui/Disclosure";
import NavMenu from "@/components/ui/NavMenu";
import type { PublicNavigationLink } from "@/content/navigation/public-types";
import { getShellStrings, type HeaderLocale } from "./header-content";
import { toNavMenuItems } from "./header-navigation";
import LanguageSwitcher from "./LanguageSwitcher";

type HeaderNavigationProps = {
  locale: HeaderLocale;
  items: readonly PublicNavigationLink[];
  navigationLabel: string;
  mobileNavigationLabel: string;
  languageLabel: string;
  languageHrefs?: Partial<Record<HeaderLocale, string>>;
};

/** Wide screens: the language switcher next to the wordmark. */
export function DesktopLanguageSwitcher({
  locale,
  languageLabel,
  languageHrefs,
}: Pick<HeaderNavigationProps, "locale" | "languageLabel" | "languageHrefs">) {
  return (
    <LanguageSwitcher
      locale={locale}
      label={languageLabel}
      hrefs={languageHrefs}
      className="hidden xl:flex"
    />
  );
}

/** Wide screens: the navigation bar under the wordmark row. */
export function DesktopNavigation({
  locale,
  items,
  navigationLabel,
}: Pick<HeaderNavigationProps, "locale" | "items" | "navigationLabel">) {
  const pathname = usePathname();

  return (
    <div className="hidden border-t border-hairline xl:block">
      <Container>
        <NavMenu
          label={navigationLabel}
          items={toNavMenuItems(items, pathname, "bar")}
          layout="bar"
          locale={locale}
        />
      </Container>
    </div>
  );
}

/**
 * Narrow screens: a "Menü" disclosure whose panel holds the same links as
 * a stacked NavMenu and the language switcher. The panel follows the
 * button in the DOM, Escape closes it (one layer at a time) and following
 * any link closes it, also when the next page keeps this header mounted.
 */
export function MobileNavigation({
  locale,
  items,
  mobileNavigationLabel,
  languageLabel,
  languageHrefs,
}: Omit<HeaderNavigationProps, "navigationLabel">) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  return (
    <Disclosure
      summary={getShellStrings(locale).menu}
      open={isOpen}
      onOpenChange={setIsOpen}
      fullWidth={false}
      className="xl:hidden"
      buttonClassName="rounded-control border-2 border-ink px-3.5 type-small font-bold text-ink hover:bg-land"
      panelClassName="absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain border-y border-ink bg-land text-ink shadow-panel"
    >
      <Container className="py-4">
        <NavMenu
          label={mobileNavigationLabel}
          items={toNavMenuItems(items, pathname, "stack")}
          layout="stack"
          locale={locale}
          onNavigate={close}
        />
        <div className="mt-3 flex items-center gap-3 border-t border-hairline pt-3">
          <LanguageSwitcher
            locale={locale}
            label={languageLabel}
            hrefs={languageHrefs}
            onNavigate={close}
          />
        </div>
      </Container>
    </Disclosure>
  );
}
