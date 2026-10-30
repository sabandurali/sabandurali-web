"use client";

import { useState } from "react";
import Container from "@/components/ui/Container";
import Disclosure from "@/components/ui/Disclosure";

export type MobileNavItem = { id: string; number: number; label: string };

/**
 * The guide's section list as a bar that stays at the top of the screen
 * below 1024 px, where the guide is a single long column and the list at
 * its start scrolls out of reach. It opens a disclosure over the page;
 * following a link, Escape, or focus or a press outside closes it. The
 * bar reserves its height as the root's scroll padding (`:root:has()`),
 * so neither a section target nor a focused control ends up under it
 * (WCAG 2.4.11). Wide screens keep each section's sign in a sticky rail
 * instead, and print leaves the bar out.
 */
export default function DistrictGuideMobileNav({
  items,
}: {
  items: readonly MobileNavItem[];
}) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Bölümlere git"
      className="sticky top-0 z-20 border-b border-tile-edge bg-band text-ink lg:hidden print:hidden max-lg:[:root:has(&)]:scroll-pt-16"
    >
      <Container>
        <Disclosure
          id="rehber-bolumleri-cubugu"
          summary="Bölümler"
          open={open}
          onOpenChange={setOpen}
          dismissOnOutside
          buttonClassName="type-small"
          panelClassName="absolute inset-x-0 top-full max-h-[70vh] overflow-y-auto border-b border-tile-edge bg-band shadow-panel"
        >
          <Container>
            <ol className="m-0 grid list-none gap-0 p-0 py-2 sm:grid-cols-2 sm:gap-x-8">
              {items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={() => setOpen(false)}
                    className="inline-flex min-h-tap items-center gap-3 type-small underline decoration-1 underline-offset-[0.2em] hover:decoration-2"
                  >
                    <span
                      aria-hidden="true"
                      className="type-data text-ink-muted"
                    >
                      {String(item.number).padStart(2, "0")}
                    </span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </Container>
        </Disclosure>
      </Container>
    </nav>
  );
}
