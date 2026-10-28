"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { ChevronDownIcon } from "./icons";
import { cx } from "./cx";
import {
  resolveButtonKey,
  resolvePanelKey,
  shouldCloseOnFocusMove,
  type MenuKeyAction,
} from "./menu-keys";
import { getUiStrings, type UiLocale } from "./strings";
import UiLink from "./UiLink";

export type NavMenuItem = {
  id: string;
  label: string;
  /** Page of this entry. With children it becomes the panel's first link. */
  href?: string | null;
  /** The current page: aria-current="page". */
  current?: boolean;
  newTab?: boolean;
  /**
   * Second level. A child with children of its own renders as a labelled
   * group of links (e.g. Avrupa Yakası → 25 districts); deeper levels are
   * not rendered.
   */
  children?: readonly NavMenuItem[];
};

type NavMenuProps = {
  /** Accessible name of the <nav>, e.g. "Ana navigasyon". */
  label: string;
  items: readonly NavMenuItem[];
  /** `bar`: horizontal with floating panels (desktop). `stack`: vertical
   * with panels in the flow (inside a mobile drawer). */
  layout?: "bar" | "stack";
  locale?: UiLocale;
  className?: string;
  /** Called after any link in the menu is activated (close a drawer). */
  onNavigate?: () => void;
};

function hasChildren(item: NavMenuItem) {
  return (item.children?.length ?? 0) > 0;
}

function containsCurrent(item: NavMenuItem): boolean {
  return item.current === true || (item.children ?? []).some(containsCurrent);
}

const topLinkClassName =
  "relative flex min-h-tap items-center gap-1.5 px-1 text-small text-ink no-underline hover:underline hover:decoration-2 hover:underline-offset-[0.3em]";

/** Signal bar under the entry of the current section (not colour alone:
 * the link itself also turns bold through aria-current). */
const currentBarClassName =
  "after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-signal";

/**
 * Site navigation with disclosure panels (see menu-keys.ts for the keyboard
 * model). Not an ARIA `menu`: entries are links and buttons, so screen
 * readers keep their normal browse mode.
 */
export default function NavMenu({
  label,
  items,
  layout = "bar",
  locale = "tr",
  className,
  onNavigate,
}: NavMenuProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const baseId = useId();

  useEffect(() => {
    if (openId === null) return;

    function handlePointerDown(event: PointerEvent) {
      const nav = navRef.current;
      if (nav && event.target instanceof Node && !nav.contains(event.target)) {
        setOpenId(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [openId]);

  return (
    <nav ref={navRef} aria-label={label} className={className}>
      <ul
        className={cx(
          "m-0 flex list-none p-0",
          layout === "bar"
            ? "flex-wrap items-stretch gap-x-[clamp(1rem,2.2vw,2.25rem)]"
            : "flex-col gap-y-1",
        )}
      >
        {items.map((item) =>
          hasChildren(item) ? (
            <DropdownItem
              key={item.id}
              item={item}
              panelId={`${baseId}-${item.id}-panel`}
              isOpen={openId === item.id}
              onOpen={() => setOpenId(item.id)}
              onClose={() =>
                setOpenId((current) => (current === item.id ? null : current))
              }
              layout={layout}
              locale={locale}
              onNavigate={onNavigate}
            />
          ) : item.href ? (
            <li key={item.id} className="flex">
              <UiLink
                href={item.href}
                newTab={item.newTab}
                aria-current={item.current ? "page" : undefined}
                onClick={onNavigate}
                className={cx(
                  topLinkClassName,
                  item.current ? "font-bold" : "font-medium",
                  item.current && layout === "bar" && currentBarClassName,
                )}
              >
                {item.label}
              </UiLink>
            </li>
          ) : null,
        )}
      </ul>
    </nav>
  );
}

type DropdownItemProps = {
  item: NavMenuItem;
  panelId: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  layout: "bar" | "stack";
  locale: UiLocale;
  onNavigate?: () => void;
};

function DropdownItem({
  item,
  panelId,
  isOpen,
  onOpen,
  onClose,
  layout,
  locale,
  onNavigate,
}: DropdownItemProps) {
  const strings = getUiStrings(locale);
  const itemRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<"first" | "last" | null>(null);
  const [alignEnd, setAlignEnd] = useState(false);
  const children = item.children ?? [];
  const isCurrentSection = containsCurrent(item);
  const hasGroups = children.some(hasChildren);

  function getPanelLinks(): HTMLAnchorElement[] {
    return Array.from(
      panelRef.current?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? [],
    );
  }

  function focusLink(position: "first" | "last") {
    const links = getPanelLinks();
    links[position === "first" ? 0 : links.length - 1]?.focus();
  }

  // Keyboard opening moves focus into the panel once it is rendered.
  useEffect(() => {
    if (!isOpen || pendingFocus.current === null) return;
    focusLink(pendingFocus.current);
    pendingFocus.current = null;
  });

  function open() {
    // Entries in the right half of the viewport open their floating panel
    // towards the left, so it never leaves the screen.
    const button = buttonRef.current;
    if (button && layout === "bar") {
      const { left, right } = button.getBoundingClientRect();
      setAlignEnd(
        (left + right) / 2 > document.documentElement.clientWidth / 2,
      );
    }
    onOpen();
  }

  function apply(action: MenuKeyAction, event: KeyboardEvent) {
    switch (action.type) {
      case "none":
        return;
      case "open":
        event.preventDefault();
        if (isOpen) {
          focusLink(action.focus);
        } else {
          pendingFocus.current = action.focus;
          open();
        }
        return;
      case "close":
        event.preventDefault();
        onClose();
        if (action.focusButton) buttonRef.current?.focus();
        return;
      case "focus-link":
        event.preventDefault();
        getPanelLinks()[action.index]?.focus();
        return;
    }
  }

  function handleButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    apply(resolveButtonKey(event.key, isOpen), event);
  }

  function handlePanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const links = getPanelLinks();
    const index =
      event.target instanceof HTMLAnchorElement
        ? links.indexOf(event.target)
        : -1;
    apply(resolvePanelKey(event.key, index, links.length), event);
  }

  function handleBlur(event: FocusEvent<HTMLLIElement>) {
    const item = itemRef.current;
    const next =
      event.relatedTarget instanceof Node ? event.relatedTarget : null;
    if (isOpen && item && shouldCloseOnFocusMove(item, next)) onClose();
  }

  function handlePanelClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest("a")) {
      onClose();
      onNavigate?.();
    }
  }

  return (
    <li
      ref={itemRef}
      onBlur={handleBlur}
      className={cx("flex flex-col", layout === "bar" && "relative")}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => (isOpen ? onClose() : open())}
        onKeyDown={handleButtonKeyDown}
        className={cx(
          topLinkClassName,
          "group cursor-pointer",
          isCurrentSection ? "font-bold" : "font-medium",
          isCurrentSection && layout === "bar" && currentBarClassName,
          layout === "stack" && "justify-between",
        )}
      >
        {item.label}
        <ChevronDownIcon
          size={16}
          className="shrink-0 transition-transform duration-150 ease-atlas group-aria-expanded:rotate-180"
        />
      </button>
      <div
        ref={panelRef}
        id={panelId}
        hidden={!isOpen}
        onKeyDown={handlePanelKeyDown}
        onClick={handlePanelClick}
        className={cx(
          layout === "bar"
            ? cx(
                "absolute top-full z-40 mt-0.5 max-h-[calc(100dvh-10rem)] w-max max-w-[min(44rem,calc(100vw-2rem))] min-w-64 overflow-y-auto rounded-card border border-ink bg-land p-4 text-ink shadow-panel",
                alignEnd ? "right-0" : "left-0",
              )
            : "mb-2 ml-1 border-l-2 border-hairline py-1 pl-3",
        )}
      >
        {item.href ? (
          <UiLink
            href={item.href}
            newTab={item.newTab}
            aria-current={item.current ? "page" : undefined}
            className="mb-2 flex min-h-tap items-center px-2.5 font-bold text-ink underline decoration-1 underline-offset-[0.2em] hover:decoration-2"
          >
            {strings.overview(item.label)}
          </UiLink>
        ) : null}
        <ul
          className={cx(
            "m-0 grid list-none p-0",
            hasGroups ? "gap-x-8 gap-y-4 md:grid-cols-2" : "gap-y-0.5",
          )}
        >
          {children.map((child) =>
            hasChildren(child) ? (
              <PanelGroup
                key={child.id}
                group={child}
                groupId={`${panelId}-${child.id}`}
                locale={locale}
              />
            ) : (
              <li key={child.id}>
                <PanelLink link={child} />
              </li>
            ),
          )}
        </ul>
      </div>
    </li>
  );
}

function PanelLink({
  link,
  dense = false,
}: {
  link: NavMenuItem;
  dense?: boolean;
}) {
  if (!link.href)
    return <span className="flex px-2.5 text-ink-muted">{link.label}</span>;

  return (
    <UiLink
      href={link.href}
      newTab={link.newTab}
      prefetch={dense ? false : undefined}
      aria-current={link.current ? "page" : undefined}
      className={cx(
        "flex items-center rounded-tile px-2.5 text-ink no-underline hover:bg-band hover:underline aria-[current=page]:font-bold aria-[current=page]:underline",
        dense ? "min-h-9 text-small" : "min-h-tap",
      )}
    >
      {link.label}
    </UiLink>
  );
}

function PanelGroup({
  group,
  groupId,
  locale,
}: {
  group: NavMenuItem;
  groupId: string;
  locale: UiLocale;
}) {
  const strings = getUiStrings(locale);

  return (
    <li>
      <p id={groupId} className="m-0 mb-1 px-2.5 type-label text-ink-muted">
        {group.label}
      </p>
      {group.href ? (
        <PanelLink
          link={{
            ...group,
            label: strings.overview(group.label),
            children: [],
          }}
        />
      ) : null}
      <ul
        aria-labelledby={groupId}
        className="m-0 grid list-none grid-cols-2 gap-x-2 p-0 lg:grid-cols-3"
      >
        {(group.children ?? []).map((link) => (
          <li key={link.id}>
            <PanelLink link={{ ...link, children: [] }} dense />
          </li>
        ))}
      </ul>
    </li>
  );
}
