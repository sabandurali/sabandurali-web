"use client";

import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import FormStatus from "@/components/ui/FormStatus";
import type { ContactContent } from "@/content/contactContent";
import {
  getFormspreeEndpoint,
  getSubmissionMessage,
  honeypotFieldName,
  toFormStatusState,
} from "./contact-submission";
import PrivacyAcknowledgement from "./PrivacyAcknowledgement";
import { useFormspreeSubmission } from "./useFormspreeSubmission";

type ContactFormProps = {
  content: ContactContent;
  /** Id of the visible heading that names the form. */
  labelledBy?: string;
  /** Formspree form id; defaults to the public build-time variable. */
  formId?: string;
};

/* Same boundary, ground and focus treatment as <Input>; the native arrow
   stays (it is the affordance people know). */
const firstFieldId = "contact-name";

const selectClassName =
  "block min-h-12 w-full rounded-control border border-tile-edge bg-land px-3.5 py-2.5 text-base text-ink hover:border-ink focus-visible:border-ink";

/**
 * Contact form (FE-21, SEC-14). Visible labels with "(zorunlu)", native
 * validation, one FormStatus outside the form for progress and results, and
 * a submit button that stays focusable while sending (aria-disabled). The
 * honeypot is off-screen, `inert` and hidden from assistive technology, and
 * a filled one is rejected before anything is sent.
 */
export default function ContactForm({
  content,
  labelledBy,
  formId = process.env.NEXT_PUBLIC_FORMSPREE_CONTACT_FORM_ID,
}: ContactFormProps) {
  const { errorKind, handleSubmit, resetStatus, status } =
    useFormspreeSubmission({ formId });
  const isSending = status === "loading";
  const locale = content.locale;

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
        method="post"
        action={getFormspreeEndpoint(formId) ?? undefined}
        onSubmit={handleSubmit}
        aria-labelledby={labelledBy}
        className="relative flex flex-col gap-6"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            id={firstFieldId}
            label={content.fields.name}
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
          <Field label={content.fields.email} required locale={locale}>
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

        <Field label={content.fields.subject} required locale={locale}>
          {(control) => (
            <select
              {...control}
              name="subject"
              defaultValue=""
              className={selectClassName}
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
          )}
        </Field>

        <Field label={content.fields.message} required locale={locale}>
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

      <FormStatus
        state={toFormStatusState(status)}
        message={getSubmissionMessage(status, errorKind, content.submission)}
        successActions={
          <Button variant="secondary" size="sm" onClick={startAnotherMessage}>
            {content.submission.submitAnother}
          </Button>
        }
      />
    </div>
  );
}
