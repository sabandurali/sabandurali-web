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
  /** Wraps the button in a heading (accordion sections). */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  id?: string;
  className?: string;
  buttonClassName?: string;
  panelClassName?: string;
};

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
  headingLevel,
  id,
  className,
  buttonClassName,
  panelClassName,
}: DisclosureProps) {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const panelId = `${baseId}-panel`;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape" || !isOpen) return;
    event.stopPropagation();
    setIsOpen(false);
    buttonRef.current?.focus();
  }

  const button = (
    <button
      ref={buttonRef}
      id={`${baseId}-button`}
      type="button"
      aria-expanded={isOpen}
      aria-controls={panelId}
      onClick={() => setIsOpen((open) => !open)}
      className={cx(
        "group flex min-h-tap w-full items-center justify-between gap-3 text-left font-bold",
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
