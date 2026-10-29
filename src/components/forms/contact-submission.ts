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

/** The parts of a <form> element the submission flow uses. */
export type SubmittableForm = {
  checkValidity: () => boolean;
  reportValidity: () => void;
  reset: () => void;
};

/** What the form shows after a submit attempt; `ignored` changes nothing. */
export type SubmissionOutcome =
  | { kind: "ignored" }
  | {
      kind: "result";
      status: SubmissionStatus;
      errorKind: SubmissionErrorKind;
    };

type SubmitContactFormOptions = {
  form: SubmittableForm;
  /** Reads the fields; called only for a valid form. */
  readFormData: () => FormData;
  formId: string | undefined;
  fetch: (url: string, init: RequestInit) => Promise<{ ok: boolean }>;
  /** Shared across submits: true while a request is on its way. */
  inFlight: { current: boolean };
  /** Called when the request starts, to show the "sending" state. */
  onLoading: () => void;
};

const resultOf = (
  status: SubmissionStatus,
  errorKind: SubmissionErrorKind = null,
): SubmissionOutcome => ({ kind: "result", status, errorKind });

/**
 * One submit of the contact form, independent of React. A second submit
 * while a request is in flight is ignored (the button stays focusable with
 * aria-disabled), an invalid form only reports its errors, a filled
 * honeypot looks like a success without sending anything (SEC-14), a
 * missing endpoint is a configuration error, and only a 2xx response is a
 * success. The form is reset only after a success.
 */
export async function submitContactForm({
  form,
  readFormData,
  formId,
  fetch,
  inFlight,
  onLoading,
}: SubmitContactFormOptions): Promise<SubmissionOutcome> {
  if (inFlight.current) return { kind: "ignored" };

  if (!form.checkValidity()) {
    form.reportValidity();
    return { kind: "ignored" };
  }

  const formData = readFormData();

  if (isHoneypotFilled(formData)) {
    form.reset();
    return resultOf("success");
  }

  const endpoint = getFormspreeEndpoint(formId);
  if (endpoint === null) return resultOf("error", "configuration");

  inFlight.current = true;
  onLoading();

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return resultOf("error", "general");
    form.reset();
    return resultOf("success");
  } catch {
    return resultOf("error", "general");
  } finally {
    inFlight.current = false;
  }
}
