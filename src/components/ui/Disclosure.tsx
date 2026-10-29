"use client";

import {
  createElement,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ChevronDownIcon } from "./icons";
import { cx } from "./cx";

type DisclosureProps = {
  /** Visible button text. */
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  /** Controlled state; pair it with `onOpenChange` (e.g. to close a mobile
   * drawer after a link inside it was followed). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The button spans its container (accordion rows). Turn it off for a
   * button that sits in a row, such as the header's menu button. */
  fullWidth?: boolean;
  /** Wraps the button in a heading (accordion sections). */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  id?: string;
  className?: string;
  buttonClassName?: string;
  panelClassName?: string;
};

/**
 * Whether an Escape keypress inside an open disclosure closes it. A nested
 * widget that already handled Escape (an open NavMenu panel calls
 * preventDefault) keeps it, so Escape closes one layer at a time.
 */
export function shouldCloseOnEscape(
  key: string,
  isOpen: boolean,
  defaultPrevented: boolean,
): boolean {
  return key === "Escape" && isOpen && !defaultPrevented;
}

/**
 * Show/hide button (WAI-ARIA disclosure). The panel follows its button in
 * the DOM, stays in the DOM while closed (`hidden`), so `aria-controls`
 * always points to a real element. Escape inside the panel closes it and
 * returns focus to the button. Nothing traps focus.
 */
export default function Disclosure({
  summary,
  children,
  defaultOpen = false,
  open,
  onOpenChange,
  fullWidth = true,
  headingLevel,
  id,
  className,
  buttonClassName,
  panelClassName,
}: DisclosureProps) {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const panelId = `${baseId}-panel`;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = open ?? uncontrolledOpen;
  const buttonRef = useRef<HTMLButtonElement>(null);

  function setOpen(next: boolean) {
    if (open === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!shouldCloseOnEscape(event.key, isOpen, event.defaultPrevented)) {
      return;
    }
    event.stopPropagation();
    setOpen(false);
    buttonRef.current?.focus();
  }

  const button = (
    <button
      ref={buttonRef}
      id={`${baseId}-button`}
      type="button"
      aria-expanded={isOpen}
      aria-controls={panelId}
      onClick={() => setOpen(!isOpen)}
      className={cx(
        "group flex min-h-tap items-center gap-3 text-left font-bold",
        fullWidth && "w-full justify-between",
        buttonClassName,
      )}
    >
      <span>{summary}</span>
      <ChevronDownIcon className="shrink-0 transition-transform duration-150 ease-atlas group-aria-expanded:rotate-180" />
    </button>
  );

  return (
    <div className={className} onKeyDown={handleKeyDown}>
      {headingLevel
        ? createElement(
            `h${headingLevel}`,
            { className: "m-0 type-h4" },
            button,
          )
        : button}
      <div id={panelId} hidden={!isOpen} className={panelClassName}>
        {children}
      </div>
    </div>
  );
}
