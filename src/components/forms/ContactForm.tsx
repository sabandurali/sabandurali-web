"use client";

import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import FormStatus from "@/components/ui/FormStatus";
import type { ContactContent } from "@/content/contactContent";
import {
  getFormspreeEndpoint,
  getSubmissionMessage,
  honeypotFieldName,
  toFormStatusState,
} from "./contact-submission";
import {
  getValidationSummary,
  privacyAcknowledgementLabel,
} from "./contact-validation";
import PrivacyAcknowledgement from "./PrivacyAcknowledgement";
import { useFormspreeSubmission } from "./useFormspreeSubmission";

type ContactFormProps = {
  content: ContactContent;
  /** Id of the visible heading that names the form. */
  labelledBy?: string;
  /** Formspree form id; defaults to the public build-time variable. */
  formId?: string;
};

const firstFieldId = "contact-name";

/**
 * Turns the browser's validation bubbles off once the script runs: from
 * then on the form shows its own messages (FRONTEND-3). Without JavaScript
 * the attribute is never set and the browser still checks the fields
 * before posting to Formspree.
 */
function takeOverValidation(form: HTMLFormElement | null) {
  if (form) form.noValidate = true;
}

/**
 * Contact form (FE-21, SEC-14, FRONTEND-3). Visible labels with
 * "(zorunlu)"; on an invalid submit every invalid field shows a lasting
 * message in the page's language ("Hata:" prefix, aria-invalid,
 * aria-describedby), focus moves to the first one and, with more than one,
 * FormStatus lists them. One FormStatus outside the form for progress,
 * results and that summary, and
 * a submit button that stays focusable while sending (aria-disabled). The
 * honeypot is off-screen, `inert` and hidden from assistive technology, and
 * a filled one is rejected before anything is sent.
 */
export default function ContactForm({
  content,
  labelledBy,
  formId = process.env.NEXT_PUBLIC_FORMSPREE_CONTACT_FORM_ID,
}: ContactFormProps) {
  const locale = content.locale;
  const {
    errorKind,
    fieldErrors,
    handleFieldChange,
    handleSubmit,
    resetStatus,
    status,
  } = useFormspreeSubmission({ formId, locale });
  const isSending = status === "loading";
  const validationSummary = getValidationSummary(
    fieldErrors,
    {
      name: content.fields.name,
      email: content.fields.email,
      subject: content.fields.subject,
      message: content.fields.message,
      privacyAcknowledgement: privacyAcknowledgementLabel[locale],
    },
    locale,
  );

  function startAnotherMessage() {
    resetStatus();
    // The "new message" button disappears with the result: continue from
    // the first field instead of losing focus to the page.
    document.getElementById(firstFieldId)?.focus();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Before hydration (or without JavaScript) the browser posts straight
          to Formspree, never to this page: the personal data only goes where
          the privacy notice says it goes. */}
      <form
        ref={takeOverValidation}
        method="post"
        action={getFormspreeEndpoint(formId) ?? undefined}
        onSubmit={handleSubmit}
        onChange={handleFieldChange}
        aria-labelledby={labelledBy}
        className="relative flex flex-col gap-6"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            id={firstFieldId}
            label={content.fields.name}
            error={fieldErrors.name}
            required
            locale={locale}
          >
            {(control) => (
              <Input
                {...control}
                type="text"
                name="name"
                maxLength={100}
                autoComplete="name"
              />
            )}
          </Field>
          <Field
            label={content.fields.email}
            error={fieldErrors.email}
            required
            locale={locale}
          >
            {(control) => (
              <Input
                {...control}
                type="email"
                name="email"
                maxLength={200}
                autoComplete="email"
                spellCheck={false}
              />
            )}
          </Field>
        </div>

        <Field
          label={content.fields.subject}
          error={fieldErrors.subject}
          required
          locale={locale}
        >
          {(control) => (
            <Select {...control} name="subject" defaultValue="">
              <option value="" disabled>
                {content.fields.subjectPlaceholder}
              </option>
              {content.fields.subjectOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field
          label={content.fields.message}
          error={fieldErrors.message}
          required
          locale={locale}
        >
          {(control) => (
            <Textarea
              {...control}
              name="message"
              minLength={10}
              maxLength={3000}
              rows={8}
            />
          )}
        </Field>

        {/* SEC-14 honeypot: never visible, never focusable, never announced. */}
        <div
          aria-hidden="true"
          inert
          data-honeypot=""
          className="pointer-events-none absolute top-0 -left-[10000px] h-px w-px overflow-hidden opacity-0"
        >
          <label htmlFor="contact-gotcha">Website</label>
          <input
            id="contact-gotcha"
            type="text"
            name={honeypotFieldName}
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </div>

        <input type="hidden" name="language" value={locale} />
        <input type="hidden" name="formType" value="contact" />

        <PrivacyAcknowledgement
          id="contact-privacy-acknowledgement"
          locale={locale}
          content={content.privacyAcknowledgement}
          error={fieldErrors.privacyAcknowledgement}
        />

        <div>
          <Button
            type="submit"
            aria-disabled={isSending || undefined}
            className="w-full sm:w-auto sm:min-w-56"
          >
            {isSending
              ? content.submission.submitting
              : content.submission.submit}
          </Button>
        </div>
      </form>

      {/* A validation summary is announced, but focus goes to the first
          invalid field instead of the message. */}
      <FormStatus
        state={validationSummary ? "error" : toFormStatusState(status)}
        message={
          validationSummary ??
          getSubmissionMessage(status, errorKind, content.submission)
        }
        focusResult={validationSummary === undefined}
        successActions={
          <Button variant="secondary" size="sm" onClick={startAnotherMessage}>
            {content.submission.submitAnother}
          </Button>
        }
      />
    </div>
  );
}
