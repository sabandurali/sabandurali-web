"use client";

import { useRef, useState, type FormEvent } from "react";

export type SubmissionStatus = "idle" | "loading" | "success" | "error";
export type SubmissionErrorKind = "general" | "configuration" | null;

type UseFormspreeSubmissionOptions = {
  formId?: string;
};

function isSafeFormId(formId: string) {
  return /^[a-zA-Z0-9_-]+$/.test(formId);
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) return null;

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function useFormspreeSubmission({
  formId,
}: UseFormspreeSubmissionOptions) {
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [errorKind, setErrorKind] =
    useState<SubmissionErrorKind>(null);
  const submissionInFlight = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;

    if (submissionInFlight.current) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const normalizedFormId = formId?.trim() ?? "";

    if (!normalizedFormId || !isSafeFormId(normalizedFormId)) {
      setErrorKind("configuration");
      setStatus("error");
      return;
    }

    const formData = new FormData(form);
    const honeypotValue = formData.get("website");

    if (typeof honeypotValue === "string" && honeypotValue.trim()) {
      form.reset();
      setErrorKind(null);
      setStatus("success");
      return;
    }

    submissionInFlight.current = true;
    setErrorKind(null);
    setStatus("loading");

    try {
      const response = await fetch(
        `https://formspree.io/f/${normalizedFormId}`,
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        },
      );
      const responseData = await readJsonResponse(response);

      if (!response.ok) {
        void responseData;
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
