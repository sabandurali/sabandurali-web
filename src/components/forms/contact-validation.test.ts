import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { contactContent } from "@/content/contactContent";
import PrivacyAcknowledgement from "./PrivacyAcknowledgement";
import {
  contactFieldNames,
  getContactFieldError,
  getContactFieldErrors,
  getValidationSummary,
  invalidFieldNames,
  privacyAcknowledgementLabel,
  type ContactControl,
  type ControlValidity,
} from "./contact-validation";

const valid: ControlValidity = {
  valueMissing: false,
  typeMismatch: false,
  tooShort: false,
  tooLong: false,
};

function control(
  name: string,
  value: string,
  overrides: Partial<ControlValidity> = {},
  extra: Partial<ContactControl> = {},
): ContactControl {
  return { name, value, validity: { ...valid, ...overrides }, ...extra };
}

/** The five fields of a correctly filled form. */
const filled = (): ContactControl[] => [
  control("name", "Ayşe Yılmaz", {}, { maxLength: 100 }),
  control("email", "ayse@example.com", {}, { maxLength: 200 }),
  control("subject", "Araştırma"),
  control(
    "message",
    "Merhaba, bir sorum var.",
    {},
    { minLength: 10, maxLength: 3000 },
  ),
  control("privacyAcknowledgement", "on", {}, { isCheckbox: true }),
];

test("FRONTEND-3: a correctly filled form has no field errors", () => {
  assert.deepEqual(getContactFieldErrors(filled(), "tr"), {});
});

test("FRONTEND-3: every empty field gets its own Turkish message", () => {
  const empty = [
    control("name", "", { valueMissing: true }),
    control("email", "", { valueMissing: true }),
    control("subject", "", { valueMissing: true }),
    control("message", "", { valueMissing: true }, { minLength: 10 }),
    control(
      "privacyAcknowledgement",
      "",
      { valueMissing: true },
      { isCheckbox: true },
    ),
  ];
  assert.deepEqual(getContactFieldErrors(empty, "tr"), {
    name: "Adınızı ve soyadınızı yazın.",
    email: "E-posta adresinizi yazın.",
    subject: "Bir konu seçin.",
    message: "Mesajınızı yazın.",
    privacyAcknowledgement:
      "Göndermek için aydınlatma metnini okuduğunuzu işaretleyerek onaylayın.",
  });
  const english = getContactFieldErrors(empty, "en");
  assert.equal(english.email, "Enter your email address.");
  assert.equal(english.subject, "Choose a subject.");
});

test("FRONTEND-3: the message names the broken rule in the page's language", () => {
  assert.equal(
    getContactFieldError(
      control("email", "ayse@", { typeMismatch: true }),
      "tr",
    ),
    "Geçerli bir e-posta adresi yazın, ör. ad@ornek.com.",
  );
  assert.equal(
    getContactFieldError(
      control("email", "ayse@", { typeMismatch: true }),
      "en",
    ),
    "Enter a valid email address, e.g. name@example.com.",
  );
  assert.equal(
    getContactFieldError(
      control("message", "Kısa", { tooShort: true }, { minLength: 10 }),
      "tr",
    ),
    "Mesaj en az 10 karakter olmalı.",
  );
  assert.equal(
    getContactFieldError(
      control("name", "x".repeat(101), { tooLong: true }, { maxLength: 100 }),
      "tr",
    ),
    "Ad soyad en fazla 100 karakter olabilir.",
  );
});

test("FRONTEND-3: spaces only count as empty and minLength is checked on the value", () => {
  // Native validation lets "   " pass `required`, and sets tooShort only
  // after an edit; the form message does neither.
  assert.equal(
    getContactFieldError(control("name", "   "), "tr"),
    "Adınızı ve soyadınızı yazın.",
  );
  assert.equal(
    getContactFieldError(control("message", "Kısa"), "tr"),
    undefined,
    "no minLength on the control, no length rule",
  );
  assert.equal(
    getContactFieldError(
      control("message", "Kısa mesaj", {}, { minLength: 11 }),
      "tr",
    ),
    "Mesaj en az 11 karakter olmalı.",
  );
  assert.equal(
    getContactFieldError(
      control("message", "Kısa", {}, { minLength: -1 }),
      "tr",
    ),
    undefined,
  );
});

test("FRONTEND-3: controls outside the contact fields are ignored", () => {
  const errors = getContactFieldErrors(
    [
      ...filled(),
      control("_gotcha", "", { valueMissing: true }),
      control("language", ""),
      control("formType", ""),
    ],
    "tr",
  );
  assert.deepEqual(errors, {});
});

test("FRONTEND-3: errors follow the order of the form, first invalid field first", () => {
  const errors = getContactFieldErrors(
    [
      control("message", "", { valueMissing: true }),
      control("email", "x", { typeMismatch: true }),
    ],
    "tr",
  );
  assert.deepEqual(Object.keys(errors), ["email", "message"]);
  assert.deepEqual(invalidFieldNames(errors), ["email", "message"]);
  assert.deepEqual(
    [...contactFieldNames],
    ["name", "email", "subject", "message", "privacyAcknowledgement"],
  );
});

test("FRONTEND-3: only two or more errors get a summary, with the visible labels", () => {
  const fields = contactContent.tr.fields;
  const labels = {
    name: fields.name,
    email: fields.email,
    subject: fields.subject,
    message: fields.message,
    privacyAcknowledgement: privacyAcknowledgementLabel.tr,
  };
  assert.equal(getValidationSummary({ email: "x" }, labels, "tr"), undefined);
  assert.equal(
    getValidationSummary(
      { message: "x", name: "y", privacyAcknowledgement: "z" },
      labels,
      "tr",
    ),
    "Formda 3 alan düzeltilmeli: Ad soyad, Mesaj, Aydınlatma metni onayı.",
  );
  assert.equal(
    getValidationSummary({ name: "x", email: "y" }, labels, "en"),
    "2 fields need attention: Ad soyad, E-posta.",
  );
});

test("FRONTEND-3: the privacy checkbox shows its error like a Field", () => {
  const html = renderToStaticMarkup(
    h(PrivacyAcknowledgement, {
      id: "privacy",
      locale: "tr",
      content: contactContent.tr.privacyAcknowledgement,
      error: "Onaylayın.",
    }),
  );
  const box = html.match(/<input[^>]*type="checkbox"[^>]*>/)?.[0] ?? "";
  assert.match(box, /aria-invalid="true"/);
  assert.match(box, /aria-describedby="privacy-error"/);
  assert.match(
    html,
    /<p id="privacy-error" class="[^"]*text-danger[^"]*">[\s\S]*<span class="sr-only">Hata: <\/span>Onaylayın\.<\/span><\/p>/,
  );

  const clean = renderToStaticMarkup(
    h(PrivacyAcknowledgement, {
      id: "privacy",
      locale: "tr",
      content: contactContent.tr.privacyAcknowledgement,
    }),
  );
  assert.doesNotMatch(clean, /aria-invalid|aria-describedby|text-danger/);
});

test("FRONTEND-3: every contact field is wired to its message, and no browser bubble is used", () => {
  const form = readFileSync(
    new URL("./ContactForm.tsx", import.meta.url),
    "utf8",
  );
  for (const name of contactFieldNames) {
    assert.match(form, new RegExp(`error=\\{fieldErrors\\.${name}\\}`), name);
  }
  assert.match(form, /form\.noValidate = true/);
  const flow = readFileSync(
    new URL("./contact-submission.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(flow, /reportValidity|checkValidity/);
});
