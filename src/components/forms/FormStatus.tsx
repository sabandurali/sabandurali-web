import type {
  SubmissionErrorKind,
  SubmissionStatus,
} from "./useFormspreeSubmission";

export type SubmissionMessages = {
  submit: string;
  submitting: string;
  success: string;
  error: string;
  configurationError: string;
  submitAnother: string;
};

type FormStatusProps = {
  status: SubmissionStatus;
  errorKind: SubmissionErrorKind;
  messages: SubmissionMessages;
  onReset: () => void;
};

export default function FormStatus({
  status,
  errorKind,
  messages,
  onReset,
}: FormStatusProps) {
  if (status === "idle") {
    return <div className="mt-4" aria-live="polite" aria-atomic="true" />;
  }

  if (status === "loading") {
    return (
      <p className="mt-4 text-sm text-muted" role="status" aria-live="polite">
        {messages.submitting}
      </p>
    );
  }

  if (status === "error") {
    return (
      <p
        className="mt-4 rounded-sm border border-accent bg-surface px-4 py-3 text-sm leading-6 text-ivory"
        role="alert"
      >
        {errorKind === "configuration"
          ? messages.configurationError
          : messages.error}
      </p>
    );
  }

  return (
    <div
      className="mt-4 rounded-sm border border-accent bg-surface px-4 py-4"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="text-sm leading-6 text-ivory">{messages.success}</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-3 inline-flex min-h-11 items-center text-sm text-accent-soft underline decoration-border underline-offset-4 transition-colors hover:text-accent-strong motion-reduce:transition-none"
      >
        {messages.submitAnother}
      </button>
    </div>
  );
}
