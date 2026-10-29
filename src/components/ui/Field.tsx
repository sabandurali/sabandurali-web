import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { AlertIcon } from "./icons";
import { cx } from "./cx";
import { getUiStrings, type UiLocale } from "./strings";
import VisuallyHidden from "./VisuallyHidden";

/** Props a form control receives from <Field>: wire them all. */
export type FieldControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  required?: boolean;
};

type FieldProps = {
  label: ReactNode;
  /** Format or purpose help, read with the control. */
  hint?: ReactNode;
  /** Validation message; marks the control invalid while present. */
  error?: ReactNode;
  required?: boolean;
  /** Control id; generated when omitted. */
  id?: string;
  locale?: UiLocale;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
};

/** Builds the describedby list: hint first, then the error. */
export function describedBy(
  hintId: string | undefined,
  errorId: string | undefined,
): string | undefined {
  const ids = [hintId, errorId].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

/**
 * Label, hint, control and error in one block. The visible label is the
 * control's <label>; hint and error are tied to it with aria-describedby,
 * and an error sets aria-invalid. Required fields say "(zorunlu)" in text.
 *
 *   <Field label="E-posta" hint="Yanıt bu adrese gelir." required>
 *     {(control) => <Input type="email" name="email" {...control} />}
 *   </Field>
 */
export function Field({
  label,
  hint,
  error,
  required = false,
  id,
  locale = "tr",
  className,
  children,
}: FieldProps) {
  const strings = getUiStrings(locale);
  const generatedId = useId();
  const controlId = id ?? `${generatedId}-control`;
  const hasError = error !== undefined && error !== null && error !== false;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = hasError ? `${controlId}-error` : undefined;

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={controlId} className="font-semibold text-ink">
        {label}
        {required ? (
          <span className="ml-2 type-caption font-normal text-ink-muted">
            ({strings.required})
          </span>
        ) : null}
      </label>
      {hint ? (
        <p id={hintId} className="m-0 type-caption text-ink-muted">
          {hint}
        </p>
      ) : null}
      {children({
        id: controlId,
        "aria-describedby": describedBy(hintId, errorId),
        "aria-invalid": hasError ? true : undefined,
        required: required || undefined,
      })}
      {hasError ? (
        <p
          id={errorId}
          className="m-0 flex items-start gap-2 type-small font-semibold text-danger"
        >
          <AlertIcon size={18} className="mt-0.5 shrink-0" />
          <span>
            <VisuallyHidden>{strings.error} </VisuallyHidden>
            {error}
          </span>
        </p>
      ) : null}
    </div>
  );
}

const controlClassName =
  "block w-full rounded-control border border-tile-edge bg-land px-3.5 py-2.5 type-control text-ink placeholder:text-ink-muted hover:border-ink focus-visible:border-ink aria-invalid:border-2 aria-invalid:border-danger disabled:cursor-not-allowed disabled:bg-band";

/** Text input: 16 px text (no iOS zoom), 3.47:1 boundary on paper. */
export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input className={cx(controlClassName, "min-h-12", className)} {...rest} />
  );
}

export function Textarea({
  className,
  rows = 6,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      className={cx(controlClassName, "min-h-36 resize-y", className)}
      {...rest}
    />
  );
}

/** Native select with the same boundary, hover, focus and error states. */
export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(controlClassName, "min-h-12", className)} {...rest}>
      {children}
    </select>
  );
}
