"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { UiLocale } from "@/components/ui/strings";
import {
  submitContactForm,
  type SubmissionErrorKind,
  type SubmissionStatus,
} from "./contact-submission";
import {
  getContactFieldError,
  getContactFieldErrors,
  invalidFieldNames,
  isContactFieldName,
  type ContactControl,
  type ContactFieldErrors,
  type ContactFieldName,
} from "./contact-validation";

export type { SubmissionErrorKind, SubmissionStatus };

type UseFormspreeSubmissionOptions = {
  formId?: string;
  locale: UiLocale;
};

/** A form control as the validator reads it; null for anything else. */
function toContactControl(element: Element): ContactControl | null {
  if (
    !(element instanceof HTMLInputElement) &&
    !(element instanceof HTMLSelectElement) &&
    !(element instanceof HTMLTextAreaElement)
  ) {
    return null;
  }
  const isCheckbox =
    element instanceof HTMLInputElement && element.type === "checkbox";
  return {
    name: element.name,
    value: isCheckbox ? (element.checked ? element.value : "") : element.value,
    isCheckbox,
    minLength: "minLength" in element ? element.minLength : undefined,
    maxLength: "maxLength" in element ? element.maxLength : undefined,
    validity: element.validity,
  };
}

function readControls(form: HTMLFormElement): ContactControl[] {
  return Array.from(form.elements).flatMap((element) => {
    const control = toContactControl(element);
    return control ? [control] : [];
  });
}

/**
 * React state around `submitContactForm`, which holds (and tests) every
 * branch: double-submit guard, validation, honeypot, missing endpoint,
 * non-2xx response and network failure.
 *
 * Validation (FRONTEND-3): an invalid submit keeps one message per field in
 * the page's language and moves focus to the first invalid field once the
 * messages are rendered (so its aria-describedby already names the error).
 * A message is updated as soon as its field changes and disappears when the
 * field becomes valid.
 */
export function useFormspreeSubmission({
  formId,
  locale,
}: UseFormspreeSubmissionOptions) {
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [errorKind, setErrorKind] = useState<SubmissionErrorKind>(null);
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  // A new object per invalid submit, so the same field is focused again.
  const [focusTarget, setFocusTarget] = useState<{
    name: ContactFieldName;
  } | null>(null);
  const submissionInFlight = useRef(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Runs after the messages are rendered, so the focused field's
  // aria-describedby already names its error. Only a new invalid submit
  // moves focus, never a message update while typing.
  useEffect(() => {
    const form = formRef.current;
    if (focusTarget === null || form === null) return;
    const control = form.elements.namedItem(focusTarget.name);
    if (control instanceof HTMLElement) control.focus();
  }, [focusTarget]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    formRef.current = form;

    const outcome = await submitContactForm({
      form,
      validate: () => getContactFieldErrors(readControls(form), locale),
      readFormData: () => new FormData(form),
      formId,
      fetch: (url, init) => fetch(url, init),
      inFlight: submissionInFlight,
      // A valid submit drops any stale field message (and with it the
      // validation summary) before the result, so a following network
      // error is a new state and FormStatus moves focus to it.
      onValid: () => setFieldErrors({}),
      onLoading: () => {
        setErrorKind(null);
        setStatus("loading");
      },
    });

    if (outcome.kind === "ignored") return;
    if (outcome.kind === "invalid") {
      setFieldErrors(outcome.errors);
      setErrorKind(null);
      setStatus("idle");
      const first = invalidFieldNames(outcome.errors)[0];
      if (first !== undefined) setFocusTarget({ name: first });
      return;
    }
    setFieldErrors({});
    setErrorKind(outcome.errorKind);
    setStatus(outcome.status);
  }

  /** Re-checks a changed field that shows a message (form `onChange`). */
  function handleFieldChange(event: FormEvent<HTMLFormElement>) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const control = toContactControl(target);
    if (control === null || !isContactFieldName(control.name)) return;
    const name = control.name;
    if (fieldErrors[name] === undefined) return;
    const message = getContactFieldError(control, locale);
    setFieldErrors((current) => {
      const next = { ...current };
      if (message === undefined) delete next[name];
      else next[name] = message;
      return next;
    });
  }

  function resetStatus() {
    if (submissionInFlight.current) return;

    setErrorKind(null);
    setStatus("idle");
  }

  return {
    errorKind,
    fieldErrors,
    handleFieldChange,
    handleSubmit,
    resetStatus,
    status,
  };
}
