import type { FormStatusState } from "@/components/ui/FormStatus";

/** Texts of the submit button and of the result announcements. */
export type SubmissionMessages = {
  submit: string;
  submitting: string;
  success: string;
  error: string;
  configurationError: string;
  submitAnother: string;
};

export type SubmissionStatus = "idle" | "loading" | "success" | "error";
export type SubmissionErrorKind = "general" | "configuration" | null;

/**
 * Name of the honeypot field (SEC-14). Formspree treats a filled `_gotcha`
 * as spam and drops the submission on its side as well, so the trap holds
 * even for a bot that posts to Formspree without running our script.
 */
export const honeypotFieldName = "_gotcha";

/**
 * True when the honeypot field holds anything other than whitespace. People
 * never see or reach the field (it is off-screen, `inert` and hidden from
 * assistive technology), so a value means an automated submission.
 */
export function isHoneypotFilled(formData: FormData): boolean {
  const value = formData.get(honeypotFieldName);
  if (value === null) return false;
  if (typeof value !== "string") return true;
  return value.trim() !== "";
}

/** A Formspree form id: letters, digits, `_` and `-` only. */
export function isSafeFormId(formId: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(formId);
}

/** The Formspree endpoint for a configured form id, or null. */
export function getFormspreeEndpoint(
  formId: string | undefined,
): string | null {
  const normalized = formId?.trim() ?? "";
  if (normalized === "" || !isSafeFormId(normalized)) return null;
  return `https://formspree.io/f/${normalized}`;
}

/** The submission status as a `FormStatus` state. */
export function toFormStatusState(status: SubmissionStatus): FormStatusState {
  return status === "loading" ? "submitting" : status;
}

/** The message `FormStatus` announces for a status; none while idle. */
export function getSubmissionMessage(
  status: SubmissionStatus,
  errorKind: SubmissionErrorKind,
  messages: SubmissionMessages,
): string | undefined {
  switch (status) {
    case "idle":
      return undefined;
    case "loading":
      return messages.submitting;
    case "success":
      return messages.success;
    case "error":
      return errorKind === "configuration"
        ? messages.configurationError
        : messages.error;
  }
}
