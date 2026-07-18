"use client";

import type { FormEvent, ReactNode } from "react";
import type { FeedbackContent } from "@/content/feedbackContent";

type FeedbackFormProps = {
  content: FeedbackContent;
};

const fieldClassName =
  "mt-3 min-h-11 w-full rounded-sm border border-border bg-background px-4 py-3 text-base text-ivory outline-none transition-colors placeholder:text-muted-dark hover:border-accent focus:border-accent motion-reduce:transition-none";

function FieldHeader({
  children,
  hint,
}: {
  children: ReactNode;
  hint: string;
}) {
  return (
    <span className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="font-medium leading-6 text-ivory">{children}</span>
      <span className="shrink-0 text-xs font-normal tracking-wide text-accent-soft">
        {hint}
      </span>
    </span>
  );
}

function RadioQuestion({
  name,
  legend,
  options,
  requiredLabel,
}: {
  name: "clarity" | "trustworthy";
  legend: string;
  options: ReadonlyArray<string>;
  requiredLabel: string;
}) {
  return (
    <fieldset className="rounded-sm border border-border bg-surface/70 p-5 sm:p-6">
      <legend className="w-full px-0">
        <FieldHeader hint={requiredLabel}>{legend}</FieldHeader>
      </legend>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {options.map((option, index) => {
          const id = `${name}-${index}`;

          return (
            <label
              key={option}
              htmlFor={id}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border border-border bg-background px-4 py-3 text-sm text-ivory transition-colors hover:border-accent has-[:checked]:border-accent has-[:checked]:bg-surface-soft has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent motion-reduce:transition-none"
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={option}
                required
                className="size-4 shrink-0 accent-[var(--accent)]"
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function FeedbackForm({ content }: FeedbackFormProps) {
  function preventSubmission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form
      method="post"
      aria-describedby="feedback-unavailable-message"
      onSubmit={preventSubmission}
    >
      <div
        id="feedback-unavailable-message"
        className="mb-6 rounded-sm border border-accent bg-surface px-5 py-4"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <p className="font-medium leading-7 text-ivory">
          {content.unavailableMessage}
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">
          {content.dataProtectionNote}
        </p>
      </div>

      <fieldset
        disabled
        aria-describedby="feedback-unavailable-message"
        className="space-y-4 border-0 p-0 disabled:opacity-75"
      >
        <RadioQuestion
          name="clarity"
          legend={content.fields.clarity.legend}
          options={content.fields.clarity.options}
          requiredLabel={content.requiredLabel}
        />

      <fieldset className="rounded-sm border border-border bg-surface/70 p-5 sm:p-6">
        <legend className="w-full px-0">
          <FieldHeader hint={content.requiredLabel}>
            {content.fields.firstImpression.legend}
          </FieldHeader>
        </legend>
        <div className="mt-4 grid grid-cols-5 gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5].map((rating) => {
            const id = `first-impression-${rating}`;

            return (
              <label
                key={rating}
                htmlFor={id}
                className="flex min-h-12 cursor-pointer items-center justify-center rounded-sm border border-border bg-background text-sm font-medium text-ivory transition-colors hover:border-accent has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-ink has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent motion-reduce:transition-none"
              >
                <input
                  id={id}
                  type="radio"
                  name="firstImpression"
                  value={rating}
                  required
                  className="sr-only"
                />
                {rating}
              </label>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted">
          <span>1 — {content.fields.firstImpression.lowLabel}</span>
          <span>5 — {content.fields.firstImpression.highLabel}</span>
        </div>
      </fieldset>

      <div className="rounded-sm border border-border bg-surface/70 p-5 sm:p-6">
        <label htmlFor="most-interesting">
          <FieldHeader hint={content.requiredLabel}>
            {content.fields.mostInteresting.label}
          </FieldHeader>
        </label>
        <select
          id="most-interesting"
          name="mostInteresting"
          required
          defaultValue=""
          className={fieldClassName}
        >
          <option value="" disabled>
            {content.fields.mostInteresting.placeholder}
          </option>
          {content.fields.mostInteresting.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-sm border border-border bg-surface/70 p-5 sm:p-6">
        <label htmlFor="confusing-parts">
          <FieldHeader hint={content.optionalLabel}>
            {content.fields.confusingParts}
          </FieldHeader>
        </label>
        <textarea
          id="confusing-parts"
          name="confusingParts"
          maxLength={1200}
          rows={5}
          className={`${fieldClassName} resize-y`}
        />
      </div>

      <RadioQuestion
        name="trustworthy"
        legend={content.fields.trustworthy.legend}
        options={content.fields.trustworthy.options}
        requiredLabel={content.requiredLabel}
      />

      <div className="rounded-sm border border-border bg-surface/70 p-5 sm:p-6">
        <label htmlFor="desired-content">
          <FieldHeader hint={content.requiredLabel}>
            {content.fields.desiredContent}
          </FieldHeader>
        </label>
        <textarea
          id="desired-content"
          name="desiredContent"
          maxLength={1200}
          rows={5}
          required
          className={`${fieldClassName} resize-y`}
        />
      </div>

      <div className="rounded-sm border border-border bg-surface/70 p-5 sm:p-6">
        <label htmlFor="additional-feedback">
          <FieldHeader hint={content.optionalLabel}>
            {content.fields.additionalFeedback}
          </FieldHeader>
        </label>
        <textarea
          id="additional-feedback"
          name="additionalFeedback"
          maxLength={1200}
          rows={5}
          className={`${fieldClassName} resize-y`}
        />
      </div>

      <div className="grid gap-4 rounded-sm border border-border bg-surface/70 p-5 sm:grid-cols-2 sm:p-6">
        <div>
          <label htmlFor="feedback-name">
            <FieldHeader hint={content.optionalLabel}>
              {content.fields.name}
            </FieldHeader>
          </label>
          <input
            id="feedback-name"
            type="text"
            name="name"
            maxLength={100}
            autoComplete="name"
            className={fieldClassName}
          />
        </div>
        <div>
          <label htmlFor="feedback-email">
            <FieldHeader hint={content.optionalLabel}>
              {content.fields.email}
            </FieldHeader>
          </label>
          <input
            id="feedback-email"
            type="email"
            name="email"
            maxLength={200}
            autoComplete="email"
            className={fieldClassName}
          />
        </div>
        <p className="text-sm leading-6 text-muted sm:col-span-2">
          {content.privacyNote}
        </p>
      </div>

        <div className="pt-3">
          <button
            type="submit"
            disabled
            aria-describedby="feedback-unavailable-message"
            className="flex min-h-12 w-full items-center justify-center rounded-sm bg-accent px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none sm:w-auto sm:min-w-56"
          >
            {content.unavailableButtonLabel}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
