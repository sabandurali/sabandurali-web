"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import NavigationLink from "./NavigationLink";
import { isHeaderNavigationItemActive, type HeaderNavigationVariant } from "./navigation";
import type { PublicNavigationLink } from "@/content/navigation/public-types";

type Props = { items: PublicNavigationLink[]; variant: HeaderNavigationVariant; onNavigate?: () => void };

function isOwnLinkActive(item: PublicNavigationLink, pathname: string) {
  const prefix = item.activePathPrefix;
  return prefix === "/" ? pathname === "/" : prefix !== undefined && (pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function DesktopLink({ item, pathname, className = "" }: { item: PublicNavigationLink; pathname: string; className?: string }) {
  if (item.href === null) return <span className={className}>{item.label}</span>;
  return <NavigationLink link={item} ariaCurrent={isOwnLinkActive(item, pathname) ? "page" : undefined} className={className}>{item.label}</NavigationLink>;
}

function DistrictBranches({ items, pathname }: { items: PublicNavigationLink[]; pathname: string }) {
  return <div className="mt-2 space-y-2">{items.map((side) => <details key={side.id} className="border-t border-border pt-2"><summary className="min-h-9 cursor-pointer list-none text-xs font-semibold text-accent-soft marker:hidden">{side.label} <span aria-hidden="true">▾</span></summary><div className="grid grid-cols-2 gap-x-3 pb-2 pt-1 xl:grid-cols-3">{side.children.map((district) => <DesktopLink key={district.id} item={district} pathname={pathname} className="flex min-h-8 items-center text-xs text-muted transition-colors hover:text-ivory" />)}</div></details>)}</div>;
}

function WorkspaceMegaPanel({ item, pathname }: { item: PublicNavigationLink; pathname: string }) {
  const [allWorkspaces, ...workspaces] = item.children;
  return <>{allWorkspaces && <DesktopLink item={allWorkspaces} pathname={pathname} className="inline-flex min-h-10 items-center text-sm font-semibold text-accent-soft hover:text-ivory" />}<div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{workspaces.map((workspace) => <section key={workspace.id} className="border border-border bg-surface p-4"><DesktopLink item={workspace} pathname={pathname} className="text-base font-semibold text-ivory hover:text-accent-soft" /><ul className="mt-2 space-y-1">{workspace.children.map((entry) => <li key={entry.id}><DesktopLink item={entry} pathname={pathname} className="flex min-h-8 items-center text-xs text-muted transition-colors hover:text-ivory" />{entry.children.length > 0 && <DistrictBranches items={entry.children} pathname={pathname} />}</li>)}</ul></section>)}</div></>;
}

function DesktopPanel({ item, pathname }: { item: PublicNavigationLink; pathname: string }) {
  const isWorkspacePanel = item.href === "/calisma-alanlari";
  return <div className={`max-h-[calc(100vh-8rem)] overflow-y-auto border border-border bg-background p-4 shadow-2xl shadow-black/30 ${isWorkspacePanel ? "w-[min(calc(100vw-2rem),72rem)]" : "w-[min(calc(100vw-2rem),28rem)]"}`}>{isWorkspacePanel ? <WorkspaceMegaPanel item={item} pathname={pathname} /> : <ul className="grid gap-1 sm:grid-cols-2">{item.children.map((child) => <li key={child.id}><DesktopLink item={child} pathname={pathname} className="flex min-h-11 items-center rounded-sm px-3 text-sm text-ivory transition-colors hover:bg-surface hover:text-accent-soft" /></li>)}</ul>}</div>;
}

function MobileItem({ item, pathname, level, onNavigate }: { item: PublicNavigationLink; pathname: string; level: number; onNavigate?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children.length > 0;
  const submenuID = `mobile-submenu-${item.id}`;
  const isActive = isHeaderNavigationItemActive(item, pathname);
  const linkClassName = `flex min-h-11 flex-1 items-center rounded-sm px-3 transition-colors hover:bg-surface hover:text-accent-soft ${isActive ? "font-semibold text-accent" : "text-ivory"}`;
  return <div><div className="flex items-center gap-1">{item.href === null ? <button type="button" className={linkClassName} aria-expanded={isOpen} aria-controls={submenuID} onClick={() => setIsOpen((open) => !open)}>{item.label}<span aria-hidden="true" className="ml-auto">▾</span></button> : <NavigationLink link={item} ariaCurrent={isOwnLinkActive(item, pathname) ? "page" : undefined} className={linkClassName} onClick={onNavigate}>{item.label}</NavigationLink>}{hasChildren && item.href !== null && <button type="button" aria-label={`${item.label} alt menüsünü ${isOpen ? "kapat" : "aç"}`} aria-expanded={isOpen} aria-controls={submenuID} className="flex size-11 shrink-0 items-center justify-center rounded-sm text-accent-soft hover:bg-surface hover:text-accent" onClick={() => setIsOpen((open) => !open)}><span aria-hidden="true">▾</span></button>}</div>{hasChildren && <div id={submenuID} className={`${isOpen ? "block" : "hidden"} ml-3 border-l border-border pl-2 ${item.children.length > 10 ? "grid grid-cols-2 gap-x-1" : ""}`}>{item.children.map((child) => <MobileItem key={child.id} item={child} pathname={pathname} level={level + 1} onNavigate={onNavigate} />)}</div>}</div>;
}

export default function HeaderNavigationLinks({ items, variant, onNavigate }: Props) {
  const pathname = usePathname();
  const [openItemID, setOpenItemID] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleItems = variant === "mobile" ? items : items.filter((item) => !item.mobileOnly);
  function cancelClose() { if (closeTimer.current !== null) clearTimeout(closeTimer.current); closeTimer.current = null; }
  function scheduleClose() { cancelClose(); closeTimer.current = setTimeout(() => setOpenItemID(null), 180); }
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) { if (event.key === "Escape") setOpenItemID(null); }
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("keydown", handleKeyDown); if (closeTimer.current !== null) clearTimeout(closeTimer.current); };
  }, []);
  if (variant === "mobile") return visibleItems.map((item) => <MobileItem key={item.id} item={item} pathname={pathname} level={0} onNavigate={onNavigate} />);
  const openItem = visibleItems.find((item) => item.id === openItemID && item.children.length > 0);
  return <div className="static flex items-center gap-5 lg:gap-7" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpenItemID(null); }} onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
    {visibleItems.map((item) => {
      const hasChildren = item.children.length > 0;
      const isOpen = openItemID === item.id;
      const isActive = isHeaderNavigationItemActive(item, pathname);
      const panelID = `desktop-submenu-${item.id}`;
      const linkClassName = `transition-colors hover:text-accent-soft ${isActive ? "font-semibold text-accent underline decoration-2 underline-offset-8" : ""}`;
      return <div key={item.id} className="flex items-center gap-1" onMouseEnter={() => hasChildren && setOpenItemID(item.id)} onFocus={(event) => { if ((event.target as HTMLElement).tagName === "A") setOpenItemID(hasChildren ? item.id : null); }}><DesktopLink item={item} pathname={pathname} className={linkClassName} />{hasChildren && <button type="button" aria-label={`${item.label} alt menüsünü ${isOpen ? "kapat" : "aç"}`} aria-expanded={isOpen} aria-controls={panelID} className="flex size-7 items-center justify-center rounded-full text-accent-soft hover:bg-surface hover:text-accent" onClick={() => setOpenItemID((current) => current === item.id ? null : item.id)}><span aria-hidden="true">▾</span></button>}</div>;
    })}
    {openItem && <div id={`desktop-submenu-${openItem.id}`} className="absolute left-1/2 top-full z-50 mt-5 -translate-x-1/2 pt-2" onMouseEnter={cancelClose}><DesktopPanel item={openItem} pathname={pathname} /></div>}
  </div>;
}
