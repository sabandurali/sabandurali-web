"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AlertIcon, CheckIcon } from "./icons";
import { cx } from "./cx";

export type FormStatusState = "idle" | "submitting" | "success" | "error";

type FormStatusProps = {
  state: FormStatusState;
  /** Message of the current state ("Gönderiliyor…", "Mesajınız alındı."). */
  message?: ReactNode;
  /**
   * After success or error, move focus to the message so keyboard and
   * screen reader users continue from the result. Default true.
   */
  focusResult?: boolean;
  /** Shown after a success, outside the live region (e.g. "Yeni mesaj"). */
  successActions?: ReactNode;
  className?: string;
};

/**
 * Which region receives focus when the state changes from `previous` to
 * `next`: only a new result moves focus, never the first render (a page
 * that loads with an error must not steal focus) and never progress.
 */
export function resultFocusTarget(
  previous: FormStatusState,
  next: FormStatusState,
): "status" | "alert" | null {
  if (previous === next) return null;
  if (next === "success") return "status";
  if (next === "error") return "alert";
  return null;
}

/**
 * Form result announcements (FE-21). Both live regions are rendered from
 * the first paint and never remount: only their text changes, which is what
 * screen readers reliably announce. Progress and success go to the polite
 * `status` region, errors to the `alert` region.
 *
 * Put it outside any `aria-busy` container, and keep the submit button
 * focusable while sending (`aria-disabled`, not `disabled`).
 */
export default function FormStatus({
  state,
  message,
  focusResult = true,
  successActions,
  className,
}: FormStatusProps) {
  const statusRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const previousState = useRef(state);

  useEffect(() => {
    const target = resultFocusTarget(previousState.current, state);
    previousState.current = state;
    if (!focusResult || target === null) return;
    (target === "status" ? statusRef : alertRef).current?.focus();
  }, [state, focusResult]);

  const hasMessage =
    message !== undefined &&
    message !== null &&
    message !== false &&
    message !== "";
  const showStatus =
    hasMessage && (state === "submitting" || state === "success");
  const showAlert = hasMessage && state === "error";

  return (
    <div className={className}>
      <div
        ref={statusRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        tabIndex={-1}
        className={cx(
          showStatus &&
            state === "success" &&
            "flex items-start gap-2.5 rounded-card border border-ink bg-land px-4 py-3 font-semibold text-ink",
          showStatus && state === "submitting" && "type-small text-ink-muted",
        )}
      >
        {showStatus && state === "success" ? (
          <CheckIcon size={20} className="mt-0.5 shrink-0" />
        ) : null}
        {showStatus ? <span>{message}</span> : null}
      </div>
      <div
        ref={alertRef}
        role="alert"
        aria-atomic="true"
        tabIndex={-1}
        className={cx(
          showAlert &&
            "flex items-start gap-2.5 rounded-card border-2 border-danger bg-land px-4 py-3 font-semibold text-danger",
        )}
      >
        {showAlert ? <AlertIcon size={20} className="mt-0.5 shrink-0" /> : null}
        {showAlert ? <span>{message}</span> : null}
      </div>
      {state === "success" && successActions ? (
        <div className="mt-3">{successActions}</div>
      ) : null}
    </div>
  );
}
