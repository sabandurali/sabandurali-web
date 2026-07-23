"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import NavigationLink from "./NavigationLink";
import {
  isHeaderNavigationItemActive,
  type HeaderNavigationVariant,
} from "./navigation";
import type { PublicNavigationLink } from "@/content/navigation/public-types";

type HeaderNavigationLinksProps = {
  items: PublicNavigationLink[];
  variant: HeaderNavigationVariant;
  onNavigate?: () => void;
};

function isOwnLinkActive(
  item: PublicNavigationLink,
  pathname: string,
): boolean {
  const prefix = item.activePathPrefix;

  return prefix === "/"
    ? pathname === "/"
    : prefix !== undefined &&
        (pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function HeaderNavigationLinks({
  items,
  variant,
  onNavigate,
}: HeaderNavigationLinksProps) {
  const pathname = usePathname();
  const [openItemID, setOpenItemID] = useState<string | null>(null);
  const visibleItems =
    variant === "mobile"
      ? items
      : items.filter((item) => !item.mobileOnly);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenItemID(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function closeAfterNavigation() {
    setOpenItemID(null);
    onNavigate?.();
  }

  return visibleItems.map((item) => {
    const hasChildren = item.children.length > 0;
    const isOpen = openItemID === item.id;
    const isActive = isHeaderNavigationItemActive(item, pathname);
    const isOwnActive = isOwnLinkActive(item, pathname);
    const submenuID = `${variant}-submenu-${item.id}`;

    if (variant === "desktop") {
      const linkClassName = `transition hover:opacity-55 ${
        isActive
          ? "font-semibold text-accent underline decoration-2 underline-offset-8"
          : ""
      }`;

      return (
        <div
          key={item.id}
          className="relative"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setOpenItemID((current) =>
                current === item.id ? null : current,
              );
            }
          }}
        >
          <div className="flex items-center gap-1">
            {item.href === null ? (
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={submenuID}
                className={linkClassName}
                onClick={() =>
                  setOpenItemID((current) =>
                    current === item.id ? null : item.id,
                  )
                }
              >
                {item.label}
                <span aria-hidden="true" className="ml-1">
                  ▾
                </span>
              </button>
            ) : (
              <NavigationLink
                link={item}
                className={linkClassName}
                ariaCurrent={isOwnActive ? "page" : undefined}
              >
                {item.label}
              </NavigationLink>
            )}

            {hasChildren && item.href !== null && (
              <button
                type="button"
                aria-label={`${item.label} alt menüsünü aç`}
                aria-expanded={isOpen}
                aria-controls={submenuID}
                className="flex size-7 items-center justify-center rounded-full text-accent-soft transition hover:bg-surface hover:text-accent"
                onClick={() =>
                  setOpenItemID((current) =>
                    current === item.id ? null : item.id,
                  )
                }
              >
                <span aria-hidden="true">▾</span>
              </button>
            )}
          </div>

          {hasChildren && (
            <ul
              id={submenuID}
              className={`absolute left-0 top-full z-50 mt-3 min-w-56 rounded-sm border border-border bg-background p-2 shadow-2xl shadow-black/30 ${
                isOpen ? "block" : "hidden"
              }`}
            >
              {item.children.map((child) => {
                const childActive = isOwnLinkActive(child, pathname);

                return (
                  <li key={child.id}>
                    <NavigationLink
                      link={child}
                      ariaCurrent={childActive ? "page" : undefined}
                      className={`flex min-h-11 items-center rounded-sm px-4 text-sm transition-colors hover:bg-surface hover:text-accent-soft ${
                        childActive
                          ? "font-semibold text-accent underline decoration-2 underline-offset-4"
                          : ""
                      }`}
                    >
                      {child.label}
                    </NavigationLink>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      );
    }

    const mobileLinkClassName = `flex min-h-11 flex-1 items-center rounded-sm px-4 transition-colors hover:bg-surface hover:text-accent-soft motion-reduce:transition-none ${
      isActive
        ? "font-semibold text-accent underline decoration-2 underline-offset-4"
        : ""
    }`;

    return (
      <div key={item.id}>
        <div className="flex items-center gap-1">
          {item.href === null ? (
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={submenuID}
              className={mobileLinkClassName}
              onClick={() =>
                setOpenItemID((current) =>
                  current === item.id ? null : item.id,
                )
              }
            >
              {item.label}
              <span aria-hidden="true" className="ml-auto">
                ▾
              </span>
            </button>
          ) : (
            <NavigationLink
              link={item}
              ariaCurrent={isOwnActive ? "page" : undefined}
              className={mobileLinkClassName}
              onClick={closeAfterNavigation}
            >
              {item.label}
            </NavigationLink>
          )}

          {hasChildren && item.href !== null && (
            <button
              type="button"
              aria-label={`${item.label} alt menüsünü aç`}
              aria-expanded={isOpen}
              aria-controls={submenuID}
              className="flex size-11 shrink-0 items-center justify-center rounded-sm text-accent-soft transition-colors hover:bg-surface hover:text-accent"
              onClick={() =>
                setOpenItemID((current) =>
                  current === item.id ? null : item.id,
                )
              }
            >
              <span aria-hidden="true">▾</span>
            </button>
          )}
        </div>

        {hasChildren && (
          <ul
            id={submenuID}
            className={`ml-4 border-l border-border pl-2 ${
              isOpen ? "block" : "hidden"
            }`}
          >
            {item.children.map((child) => {
              const childActive = isOwnLinkActive(child, pathname);

              return (
                <li key={child.id}>
                  <NavigationLink
                    link={child}
                    ariaCurrent={childActive ? "page" : undefined}
                    className={`flex min-h-11 items-center rounded-sm px-4 transition-colors hover:bg-surface hover:text-accent-soft motion-reduce:transition-none ${
                      childActive
                        ? "font-semibold text-accent underline decoration-2 underline-offset-4"
                        : ""
                    }`}
                    onClick={closeAfterNavigation}
                  >
                    {child.label}
                  </NavigationLink>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  });
}
