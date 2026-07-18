"use client";

import FormStatus from "./FormStatus";
import PrivacyAcknowledgement from "./PrivacyAcknowledgement";
import { useFormspreeSubmission } from "./useFormspreeSubmission";
import type { ContactContent } from "@/content/contactContent";

type ContactFormProps = {
  content: ContactContent;
};

const fieldClassName =
  "mt-3 min-h-11 w-full rounded-sm border border-border bg-background px-4 py-3 text-base text-ivory outline-none transition-colors placeholder:text-muted-dark hover:border-accent focus:border-accent motion-reduce:transition-none";

export default function ContactForm({ content }: ContactFormProps) {
  const { errorKind, handleSubmit, resetStatus, status } =
    useFormspreeSubmission({
      formId: process.env.NEXT_PUBLIC_FORMSPREE_CONTACT_FORM_ID,
    });
  const isLoading = status === "loading";

  return (
    <form
      method="post"
      onSubmit={handleSubmit}
      aria-busy={isLoading}
      className="space-y-4"
    >
      <fieldset disabled={isLoading} className="space-y-4 border-0 p-0">
        <div className="grid gap-4 rounded-sm border border-border bg-surface/70 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <label htmlFor="contact-name">
              <span className="font-medium leading-6 text-ivory">
                {content.fields.name}
              </span>
              <span className="ml-2 text-xs text-accent-soft">
                {content.requiredLabel}
              </span>
            </label>
            <input
              id="contact-name"
              type="text"
              name="name"
              required
              maxLength={100}
              autoComplete="name"
              className={fieldClassName}
            />
          </div>

          <div>
            <label htmlFor="contact-email">
              <span className="font-medium leading-6 text-ivory">
                {content.fields.email}
              </span>
              <span className="ml-2 text-xs text-accent-soft">
                {content.requiredLabel}
              </span>
            </label>
            <input
              id="contact-email"
              type="email"
              name="email"
              required
              maxLength={200}
              autoComplete="email"
              className={fieldClassName}
            />
          </div>
        </div>

        <div className="rounded-sm border border-border bg-surface/70 p-5 sm:p-6">
          <label htmlFor="contact-subject">
            <span className="font-medium leading-6 text-ivory">
              {content.fields.subject}
            </span>
            <span className="ml-2 text-xs text-accent-soft">
              {content.requiredLabel}
            </span>
          </label>
          <select
            id="contact-subject"
            name="subject"
            required
            defaultValue=""
            className={fieldClassName}
          >
            <option value="" disabled>
              {content.fields.subjectPlaceholder}
            </option>
            {content.fields.subjectOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-sm border border-border bg-surface/70 p-5 sm:p-6">
          <label htmlFor="contact-message">
            <span className="font-medium leading-6 text-ivory">
              {content.fields.message}
            </span>
            <span className="ml-2 text-xs text-accent-soft">
              {content.requiredLabel}
            </span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            minLength={10}
            maxLength={3000}
            rows={8}
            className={`${fieldClassName} resize-y`}
          />
        </div>

        <div
          aria-hidden="true"
          className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
        >
          <label htmlFor="contact-website">Website</label>
          <input
            id="contact-website"
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
        </div>

        <input type="hidden" name="language" value={content.locale} />
        <input type="hidden" name="formType" value="contact" />

        <PrivacyAcknowledgement
          id="contact-privacy-acknowledgement"
          locale={content.locale}
          content={content.privacyAcknowledgement}
          requiredLabel={content.requiredLabel}
        />

        <div className="pt-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex min-h-12 w-full items-center justify-center rounded-sm bg-accent px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none sm:w-auto sm:min-w-56"
          >
            {isLoading
              ? content.submission.submitting
              : content.submission.submit}
          </button>
        </div>
      </fieldset>

      <FormStatus
        status={status}
        errorKind={errorKind}
        messages={content.submission}
        onReset={resetStatus}
      />
    </form>
  );
}
