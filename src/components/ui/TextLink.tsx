import { ArrowUpRightIcon } from "./icons";
import { cx } from "./cx";
import { getUiStrings, type UiLocale } from "./strings";
import UiLink, { type UiLinkProps } from "./UiLink";
import VisuallyHidden from "./VisuallyHidden";

type TextLinkProps = UiLinkProps & {
  /**
   * `inline` sits in running text; `standalone` is a call to action on its
   * own line (bold, 44 px tall touch target).
   */
  variant?: "inline" | "standalone";
  tone?: "ink" | "on-sea";
  /** Shows ↗ and tells screen readers the link leaves the site. */
  external?: boolean;
  locale?: UiLocale;
};

const variantClassName = {
  inline: "underline decoration-1 underline-offset-[0.2em] hover:decoration-2",
  standalone:
    "inline-flex min-h-tap items-center gap-1.5 font-bold underline decoration-2 underline-offset-[5px] hover:decoration-[3px]",
} as const;

const toneClassName = {
  ink: "text-ink",
  "on-sea": "text-on-sea decoration-signal",
} as const;

/** Links are always underlined: colour alone never marks a link. */
export default function TextLink({
  variant = "inline",
  tone = "ink",
  external = false,
  newTab = false,
  locale = "tr",
  className,
  children,
  ...rest
}: TextLinkProps) {
  const strings = getUiStrings(locale);

  return (
    <UiLink
      newTab={newTab}
      className={cx(variantClassName[variant], toneClassName[tone], className)}
      {...rest}
    >
      {children}
      {external || newTab ? (
        <>
          <ArrowUpRightIcon size={14} className="ml-1 inline-block shrink-0" />
          <VisuallyHidden>
            {" "}
            {newTab ? strings.newTab : strings.externalLink}
          </VisuallyHidden>
        </>
      ) : null}
    </UiLink>
  );
}
