import type { ReactNode } from "react";

type VisuallyHiddenProps = {
  children: ReactNode;
  id?: string;
  /** `div` only when the hidden text contains block content. */
  as?: "span" | "div";
};

/** Text for assistive technology only (screen readers, braille). */
export default function VisuallyHidden({
  children,
  id,
  as: Tag = "span",
}: VisuallyHiddenProps) {
  return (
    <Tag id={id} className="sr-only">
      {children}
    </Tag>
  );
}
