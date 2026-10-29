"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  getFormspreeEndpoint,
  isHoneypotFilled,
  type SubmissionErrorKind,
  type SubmissionStatus,
} from "./contact-submission";

export type { SubmissionErrorKind, SubmissionStatus };

type UseFormspreeSubmissionOptions = {
  formId?: string;
};

export function useFormspreeSubmission({
  formId,
}: UseFormspreeSubmissionOptions) {
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [errorKind, setErrorKind] = useState<SubmissionErrorKind>(null);
  const submissionInFlight = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;

    // The submit button stays focusable while sending (aria-disabled), so a
    // second press must be ignored here.
    if (submissionInFlight.current) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);

    // SEC-14: a filled honeypot is rejected before anything is sent. The bot
    // sees the usual success so it learns nothing about the trap.
    if (isHoneypotFilled(formData)) {
      form.reset();
      setErrorKind(null);
      setStatus("success");
      return;
    }

    const endpoint = getFormspreeEndpoint(formId);

    if (endpoint === null) {
      setErrorKind("configuration");
      setStatus("error");
      return;
    }

    submissionInFlight.current = true;
    setErrorKind(null);
    setStatus("loading");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        setErrorKind("general");
        setStatus("error");
        return;
      }

      form.reset();
      setErrorKind(null);
      setStatus("success");
    } catch {
      setErrorKind("general");
      setStatus("error");
    } finally {
      submissionInFlight.current = false;
    }
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
