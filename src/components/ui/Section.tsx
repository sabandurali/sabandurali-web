import type { ReactNode } from "react";
import Container from "./Container";
import { cx } from "./cx";

export type SectionTone = "paper" | "land" | "band" | "sea";
export type SectionSpacing = "default" | "compact" | "none";

/* Every tone sets its own ground and text colour, so a section reads
   correctly whatever it is placed on. On sea the focus ring flips to a
   white ring around a sea halo, and native controls switch to dark. */
const toneClassName: Record<SectionTone, string> = {
  paper: "bg-paper text-ink scheme-light",
  land: "bg-land text-ink scheme-light",
  band: "bg-band text-ink scheme-light",
  sea: "bg-sea text-on-sea scheme-dark [--focus-halo:var(--color-sea)] [--focus-ring:var(--color-on-sea)]",
};

const spacingClassName: Record<SectionSpacing, string> = {
  default: "py-section",
  compact: "py-section-sm",
  none: "",
};

type SectionProps = {
  id?: string;
  /** Id of the visible heading; makes the section a named region. */
  labelledBy?: string;
  tone?: SectionTone;
  spacing?: SectionSpacing;
  /** Hairline above the section (district guide rhythm, band edges). */
  divider?: boolean;
  /** Wraps the children in <Container>; turn off for full-bleed content. */
  contained?: boolean;
  className?: string;
  children: ReactNode;
};

export default function Section({
  id,
  labelledBy,
  tone = "paper",
  spacing = "default",
  divider = false,
  contained = true,
  className,
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cx(
        toneClassName[tone],
        spacingClassName[spacing],
        divider &&
          (tone === "sea"
            ? "border-t border-sea-line"
            : "border-t border-hairline"),
        className,
      )}
    >
      {contained ? <Container>{children}</Container> : children}
    </section>
  );
}
