import type { UiLocale } from "@/components/ui/strings";

/**
 * Validation of the contact form in the page's language (FRONTEND-3).
 *
 * The browser still holds the constraints (`required`, `type="email"`,
 * `minLength`, `maxLength`) and answers whether a value breaks them; this
 * module only turns that answer into a lasting message in Turkish or
 * English, so the form never shows the browser's own bubbles (they follow
 * the browser's language, vanish after a few seconds and name one field at
 * a time).
 */

export const contactFieldNames = [
  "name",
  "email",
  "subject",
  "message",
  "privacyAcknowledgement",
] as const;

export type ContactFieldName = (typeof contactFieldNames)[number];

export type ContactFieldErrors = Partial<Record<ContactFieldName, string>>;

/** What a control tells about its value: the parts of `ValidityState` used. */
export type ControlValidity = {
  valueMissing: boolean;
  typeMismatch: boolean;
  tooShort: boolean;
  tooLong: boolean;
};

/** One control of the form as the validator reads it. */
export type ContactControl = {
  name: string;
  /** Current value; empty for an unticked checkbox. */
  value: string;
  /** True for a checkbox: its value is not trimmed. */
  isCheckbox?: boolean;
  /** `minLength`/`maxLength` of the control; absent or negative when unset. */
  minLength?: number;
  maxLength?: number;
  validity: ControlValidity;
};

type FieldMessages = {
  missing: string;
  invalidEmail?: string;
  tooShort?: (minimum: number) => string;
  tooLong?: (maximum: number) => string;
};

const messages: Record<UiLocale, Record<ContactFieldName, FieldMessages>> = {
  tr: {
    name: {
      missing: "Adınızı ve soyadınızı yazın.",
      tooLong: (maximum) => `Ad soyad en fazla ${maximum} karakter olabilir.`,
    },
    email: {
      missing: "E-posta adresinizi yazın.",
      invalidEmail: "Geçerli bir e-posta adresi yazın, ör. ad@ornek.com.",
      tooLong: (maximum) =>
        `E-posta adresi en fazla ${maximum} karakter olabilir.`,
    },
    subject: { missing: "Bir konu seçin." },
    message: {
      missing: "Mesajınızı yazın.",
      tooShort: (minimum) => `Mesaj en az ${minimum} karakter olmalı.`,
      tooLong: (maximum) => `Mesaj en fazla ${maximum} karakter olabilir.`,
    },
    privacyAcknowledgement: {
      missing:
        "Göndermek için aydınlatma metnini okuduğunuzu işaretleyerek onaylayın.",
    },
  },
  en: {
    name: {
      missing: "Enter your full name.",
      tooLong: (maximum) => `Your name can be at most ${maximum} characters.`,
    },
    email: {
      missing: "Enter your email address.",
      invalidEmail: "Enter a valid email address, e.g. name@example.com.",
      tooLong: (maximum) =>
        `Your email address can be at most ${maximum} characters.`,
    },
    subject: { missing: "Choose a subject." },
    message: {
      missing: "Enter your message.",
      tooShort: (minimum) =>
        `Your message needs at least ${minimum} characters.`,
      tooLong: (maximum) =>
        `Your message can be at most ${maximum} characters.`,
    },
    privacyAcknowledgement: {
      missing: "To send, tick the box to confirm you have read the notice.",
    },
  },
};

export function isContactFieldName(name: string): name is ContactFieldName {
  return (contactFieldNames as ReadonlyArray<string>).includes(name);
}

/**
 * The message for one control, or undefined when it is valid. A required
 * text value of only spaces counts as missing, and `minLength` is checked
 * on the value as well: browsers set `tooShort` only after the person edits
 * the field, never for a value that was filled in another way.
 */
export function getContactFieldError(
  control: ContactControl,
  locale: UiLocale,
): string | undefined {
  if (!isContactFieldName(control.name)) return undefined;
  const text = messages[locale][control.name];
  const { validity } = control;
  const value = control.isCheckbox ? control.value : control.value.trim();

  // Every contact field is required.
  if (validity.valueMissing || value === "") return text.missing;
  if (validity.typeMismatch && text.invalidEmail) return text.invalidEmail;

  const minimum = control.minLength ?? -1;
  if (
    text.tooShort &&
    minimum > 0 &&
    (validity.tooShort || value.length < minimum)
  )
    return text.tooShort(minimum);

  const maximum = control.maxLength ?? -1;
  if (
    text.tooLong &&
    maximum > 0 &&
    (validity.tooLong || control.value.length > maximum)
  )
    return text.tooLong(maximum);

  return undefined;
}

/** Messages of every invalid contact field, in the order of the form. */
export function getContactFieldErrors(
  controls: Iterable<ContactControl>,
  locale: UiLocale,
): ContactFieldErrors {
  const found: ContactFieldErrors = {};
  for (const control of controls) {
    if (!isContactFieldName(control.name)) continue;
    const message = getContactFieldError(control, locale);
    if (message !== undefined) found[control.name] = message;
  }
  const ordered: ContactFieldErrors = {};
  for (const name of contactFieldNames) {
    const message = found[name];
    if (message !== undefined) ordered[name] = message;
  }
  return ordered;
}

/** Names of the invalid fields, first one first. */
export function invalidFieldNames(
  errors: ContactFieldErrors,
): ContactFieldName[] {
  return contactFieldNames.filter((name) => errors[name] !== undefined);
}

/** Name of the privacy checkbox in the summary (it has no short label). */
export const privacyAcknowledgementLabel: Record<UiLocale, string> = {
  tr: "Aydınlatma metni onayı",
  en: "Privacy notice confirmation",
};

/**
 * The summary `FormStatus` announces when more than one field is invalid;
 * a single error is read with its field and needs no summary.
 */
export function getValidationSummary(
  errors: ContactFieldErrors,
  labels: Record<ContactFieldName, string>,
  locale: UiLocale,
): string | undefined {
  const names = invalidFieldNames(errors);
  if (names.length < 2) return undefined;
  const list = names.map((name) => labels[name]).join(", ");
  return locale === "tr"
    ? `Formda ${names.length} alan düzeltilmeli: ${list}.`
    : `${names.length} fields need attention: ${list}.`;
}
