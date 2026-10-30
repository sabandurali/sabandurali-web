/**
 * Keyboard model of the disclosure-style navigation menu (WAI-ARIA APG
 * "Disclosure Navigation Menu"). Pure functions so the behaviour is tested
 * without a DOM; NavMenu applies the results.
 *
 * - The panel opens only from its button: click, Enter or Space (native
 *   button behaviour), ArrowDown (first link) or ArrowUp (last link).
 *   Focus or hover never opens it.
 * - Escape closes the panel and returns focus to its button.
 * - Arrow keys, Home and End move between the links of an open panel.
 * - Tab is never trapped: it leaves the panel in document order, and the
 *   panel closes once focus is outside its menu item.
 */
export type MenuKeyAction =
  | { type: "none" }
  | { type: "open"; focus: "first" | "last" }
  | { type: "close"; focusButton: boolean }
  | { type: "focus-link"; index: number };

const none: MenuKeyAction = { type: "none" };

export function resolveButtonKey(key: string, isOpen: boolean): MenuKeyAction {
  switch (key) {
    case "ArrowDown":
      return { type: "open", focus: "first" };
    case "ArrowUp":
      return { type: "open", focus: "last" };
    case "Escape":
      return isOpen ? { type: "close", focusButton: true } : none;
    default:
      return none;
  }
}

export function resolvePanelKey(
  key: string,
  currentIndex: number,
  linkCount: number,
): MenuKeyAction {
  if (key === "Escape") return { type: "close", focusButton: true };
  if (linkCount === 0 || currentIndex < 0) return none;

  switch (key) {
    case "ArrowDown":
      return {
        type: "focus-link",
        index: Math.min(currentIndex + 1, linkCount - 1),
      };
    case "ArrowUp":
      return { type: "focus-link", index: Math.max(currentIndex - 1, 0) };
    case "Home":
      return { type: "focus-link", index: 0 };
    case "End":
      return { type: "focus-link", index: linkCount - 1 };
    default:
      return none;
  }
}

/**
 * Whether a focus move should close the panel. `next` is the element that
 * receives focus (FocusEvent.relatedTarget). A null target means focus left
 * for the browser chrome or a click landed on non-focusable panel content;
 * clicks outside are handled by the pointer listener instead.
 */
export function shouldCloseOnFocusMove<T>(
  item: { contains: (node: T | null) => boolean },
  next: T | null,
): boolean {
  return next !== null && !item.contains(next);
}
