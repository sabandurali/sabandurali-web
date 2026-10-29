"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  submitContactForm,
  type SubmissionErrorKind,
  type SubmissionStatus,
} from "./contact-submission";

export type { SubmissionErrorKind, SubmissionStatus };

type UseFormspreeSubmissionOptions = {
  formId?: string;
};

/**
 * React state around `submitContactForm`, which holds (and tests) every
 * branch: double-submit guard, validity, honeypot, missing endpoint,
 * non-2xx response and network failure.
 */
export function useFormspreeSubmission({
  formId,
}: UseFormspreeSubmissionOptions) {
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [errorKind, setErrorKind] = useState<SubmissionErrorKind>(null);
  const submissionInFlight = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    const outcome = await submitContactForm({
      form,
      readFormData: () => new FormData(form),
      formId,
      fetch: (url, init) => fetch(url, init),
      inFlight: submissionInFlight,
      onLoading: () => {
        setErrorKind(null);
        setStatus("loading");
      },
    });

    if (outcome.kind === "ignored") return;
    setErrorKind(outcome.errorKind);
    setStatus(outcome.status);
  }

  function resetStatus() {
    if (submissionInFlight.current) return;

    setErrorKind(null);
    setStatus("idle");
  }

  return {
    errorKind,
    handleSubmit,
    resetStatus,
    status,
  };
}
