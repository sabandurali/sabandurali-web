import type { CSSProperties } from "react";
import { cx } from "./cx";

type PlateTitleProps = {
  /** The title. District names may carry soft hyphens (getDistrictLabel). */
  children: string;
  as?: "h1" | "h2" | "p";
  id?: string;
  className?: string;
};

/** Visible characters of a title, ignoring soft hyphens. */
export function plateCharacters(title: string): number {
  return Math.max(1, Array.from(title.replaceAll("\u00ad", "")).length);
}

/**
 * The giant atlas-plate title of a district guide ("Esenler"): Archivo at
 * 125 % width, up to 150 px. Long names ("Gaziosmanpaşa") scale down to fit
 * the column on one line instead of overflowing on a phone.
 */
export default function PlateTitle({
  children,
  as: Tag = "h1",
  id,
  className,
}: PlateTitleProps) {
  const style: CSSProperties & { "--plate-chars": number } = {
    "--plate-chars": plateCharacters(children),
  };

  return (
    <div className="@container">
      <Tag id={id} className={cx("m-0 type-plate", className)} style={style}>
        {children}
      </Tag>
    </div>
  );
}
