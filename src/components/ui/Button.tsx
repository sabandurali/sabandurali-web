import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";
import UiLink, { type UiLinkProps } from "./UiLink";

export type ButtonVariant = "primary" | "secondary" | "on-sea";
export type ButtonSize = "md" | "sm";

const variantClassName: Record<ButtonVariant, string> = {
  // White on sea 13.06:1; hover sea-line keeps 7.86:1.
  primary: "bg-sea text-on-sea hover:bg-sea-line",
  // Ink on paper 11.57:1; the 2 px ink border is the control boundary.
  secondary: "border-2 border-ink text-ink hover:bg-land",
  // For sea sections: white outline button.
  "on-sea": "border-2 border-on-sea text-on-sea hover:bg-sea-line",
};

const sizeClassName: Record<ButtonSize, string> = {
  md: "min-h-12 px-5 type-control",
  sm: "min-h-tap px-4 text-small",
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-control font-bold leading-tight no-underline transition-colors duration-150 ease-atlas",
    "disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60",
    variantClassName[variant],
    sizeClassName[size],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Trailing decorative icon. */
  icon?: ReactNode;
};

/**
 * A real <button>. While a form submits, prefer `aria-disabled` over
 * `disabled`: a disabled button drops keyboard focus to <body>.
 */
export function Button({
  variant,
  size,
  icon,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, className })}
      {...rest}
    >
      {children}
      {icon ? (
        <span aria-hidden="true" className="flex">
          {icon}
        </span>
      ) : null}
    </button>
  );
}

type ButtonLinkProps = UiLinkProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
};

/** A link that looks like a button: it navigates, it does not act. */
export function ButtonLink({
  variant,
  size,
  icon,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <UiLink className={buttonClassName({ variant, size, className })} {...rest}>
      {children}
      {icon ? (
        <span aria-hidden="true" className="flex">
          {icon}
        </span>
      ) : null}
    </UiLink>
  );
}
