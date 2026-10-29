import assert from "node:assert/strict";
import test from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { contactContent } from "@/content/contactContent";
import ContactForm from "./ContactForm";
import {
  getFormspreeEndpoint,
  getSubmissionMessage,
  honeypotFieldName,
  isHoneypotFilled,
  isSafeFormId,
  submitContactForm,
  toFormStatusState,
} from "./contact-submission";
import type { ContactFieldErrors } from "./contact-validation";

/** A fake form and fetch that record what the submit flow did. */
function harness({
  errors = {} as ContactFieldErrors,
  data = { name: "Ayşe" } as Record<string, string>,
  respond = async (): Promise<{ ok: boolean }> => ({ ok: true }),
  formId = "abc123" as string | undefined,
} = {}) {
  const calls = { reset: 0, validate: 0, loading: 0, fetch: [] as string[] };
  const inFlight = { current: false };
  const options = {
    form: {
      reset: () => {
        calls.reset += 1;
      },
    },
    validate: () => {
      calls.validate += 1;
      return errors;
    },
    readFormData: () => formDataWith(data),
    formId,
    fetch: async (url: string) => {
      calls.fetch.push(url);
      assert.equal(inFlight.current, true, "in flight while sending");
      return respond();
    },
    inFlight,
    onLoading: () => {
      calls.loading += 1;
    },
  };
  return { calls, inFlight, submit: () => submitContactForm(options) };
}

const result = (status: string, errorKind: string | null = null) => ({
  kind: "result",
  status,
  errorKind,
});

test("TESTS-INFRA-6: a 2xx response is a success and resets the form", async () => {
  const { calls, inFlight, submit } = harness();
  assert.deepEqual(await submit(), result("success"));
  assert.deepEqual(calls.fetch, ["https://formspree.io/f/abc123"]);
  assert.equal(calls.loading, 1);
  assert.equal(calls.reset, 1);
  assert.equal(inFlight.current, false);
});

test("TESTS-INFRA-6: a non-2xx response or a network error is a general error", async () => {
  const rejected = harness({ respond: async () => ({ ok: false }) });
  assert.deepEqual(await rejected.submit(), result("error", "general"));
  assert.equal(rejected.calls.reset, 0, "the message is kept for a retry");
  assert.equal(rejected.inFlight.current, false);

  const offline = harness({
    respond: async () => {
      throw new TypeError("network");
    },
  });
  assert.deepEqual(await offline.submit(), result("error", "general"));
  assert.equal(offline.calls.reset, 0);
  assert.equal(offline.inFlight.current, false);
});

test("TESTS-INFRA-6: a second submit while sending is ignored", async () => {
  // Every pending response is released before anything is awaited, so a
  // broken guard fails the assertions below instead of hanging the run.
  const pending: Array<(value: { ok: boolean }) => void> = [];
  const { calls, submit } = harness({
    respond: () => new Promise((resolve) => pending.push(resolve)),
  });
  const first = submit();
  const second = submit();
  for (const release of pending) release({ ok: true });
  assert.deepEqual(await second, { kind: "ignored" });
  assert.deepEqual(await first, result("success"));
  assert.equal(calls.fetch.length, 1);
  assert.equal(calls.loading, 1);
});

test("TESTS-INFRA-6: invalid, honeypot and unconfigured submits never send", async () => {
  const invalidErrors = { email: "E-posta adresinizi yazın." };
  const invalid = harness({ errors: invalidErrors });
  assert.deepEqual(await invalid.submit(), {
    kind: "invalid",
    errors: invalidErrors,
  });
  assert.equal(invalid.calls.validate, 1);
  assert.equal(invalid.calls.reset, 0, "the typed values are kept");

  const bot = harness({ data: { name: "x", _gotcha: "spam" } });
  assert.deepEqual(await bot.submit(), result("success"));
  assert.equal(bot.calls.reset, 1);

  const unconfigured = harness({ formId: "" });
  assert.deepEqual(
    await unconfigured.submit(),
    result("error", "configuration"),
  );

  for (const { calls } of [invalid, bot, unconfigured]) {
    assert.deepEqual(calls.fetch, []);
    assert.equal(calls.loading, 0);
  }
});

function formDataWith(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(entries)) data.set(name, value);
  return data;
}

test("SEC-14: the honeypot uses Formspree's _gotcha field", () => {
  assert.equal(honeypotFieldName, "_gotcha");
});

test("SEC-14: only a non-blank honeypot value marks a submission as spam", () => {
  assert.equal(isHoneypotFilled(formDataWith({ name: "Ayşe" })), false);
  assert.equal(isHoneypotFilled(formDataWith({ _gotcha: "" })), false);
  assert.equal(isHoneypotFilled(formDataWith({ _gotcha: "  \n" })), false);
  assert.equal(
    isHoneypotFilled(formDataWith({ _gotcha: "https://spam.example" })),
    true,
  );

  const withFile = new FormData();
  withFile.set("_gotcha", new Blob(["x"]), "x.txt");
  assert.equal(isHoneypotFilled(withFile), true);
});

test("the Formspree endpoint is built only from a safe form id", () => {
  assert.equal(getFormspreeEndpoint(undefined), null);
  assert.equal(getFormspreeEndpoint("   "), null);
  assert.equal(getFormspreeEndpoint("abc/../x"), null);
  assert.equal(getFormspreeEndpoint("abc?x=1"), null);
  assert.equal(
    getFormspreeEndpoint(" xyzAB_12-c "),
    "https://formspree.io/f/xyzAB_12-c",
  );
  assert.equal(isSafeFormId("abc"), true);
  assert.equal(isSafeFormId("a b"), false);
});

test("submission statuses map to FormStatus states and messages", () => {
  const messages = contactContent.tr.submission;

  assert.equal(toFormStatusState("idle"), "idle");
  assert.equal(toFormStatusState("loading"), "submitting");
  assert.equal(toFormStatusState("success"), "success");
  assert.equal(toFormStatusState("error"), "error");

  assert.equal(getSubmissionMessage("idle", null, messages), undefined);
  assert.equal(
    getSubmissionMessage("loading", null, messages),
    messages.submitting,
  );
  assert.equal(
    getSubmissionMessage("success", null, messages),
    messages.success,
  );
  assert.equal(
    getSubmissionMessage("error", "general", messages),
    messages.error,
  );
  assert.equal(
    getSubmissionMessage("error", "configuration", messages),
    messages.configurationError,
  );
});

test("FE-21: the form is never aria-busy and the submit button never disabled", () => {
  const html = renderToStaticMarkup(
    h(ContactForm, { content: contactContent.tr, formId: "test" }),
  );

  assert.doesNotMatch(html, /aria-busy/);
  assert.doesNotMatch(html, /<fieldset/);
  const submit = html.match(/<button type="submit"[^>]*>/)?.[0] ?? "";
  assert.notEqual(submit, "");
  assert.doesNotMatch(submit, /\sdisabled=""/);
  assert.doesNotMatch(submit, /\saria-disabled="/);
});

test("FE-21: the status regions live outside the form", () => {
  const html = renderToStaticMarkup(
    h(ContactForm, { content: contactContent.en, formId: "test" }),
  );
  const formEnd = html.indexOf("</form>");

  assert.ok(formEnd > 0);
  assert.ok(html.indexOf('role="status"') > formEnd);
  assert.ok(html.indexOf('role="alert"') > formEnd);
});

test("every visible field has a label that says it is required", () => {
  const html = renderToStaticMarkup(
    h(ContactForm, { content: contactContent.tr, formId: "test" }),
  );

  for (const name of ["name", "email", "subject", "message"]) {
    const control = html.match(
      new RegExp(`<(?:input|select|textarea)[^>]*name="${name}"[^>]*>`),
    )?.[0];
    assert.ok(control, `${name} control`);
    assert.match(control, /\srequired=""/);
    const id = control.match(/\sid="([^"]+)"/)?.[1];
    assert.ok(id, `${name} id`);
    assert.match(html, new RegExp(`<label for="${id}"[^>]*>[^<]+<span`));
  }
  assert.equal([...html.matchAll(/\(zorunlu\)/g)].length, 5);
  const checkbox =
    html.match(/<input[^>]*name="privacyAcknowledgement"[^>]*>/)?.[0] ?? "";
  assert.match(checkbox, /type="checkbox"/);
  assert.match(checkbox, /\srequired=""/);
});

test("SEC-14: the honeypot is hidden from people, keyboards and assistive technology", () => {
  const html = renderToStaticMarkup(
    h(ContactForm, { content: contactContent.tr, formId: "test" }),
  );
  const wrapper = html.match(/<div[^>]*data-honeypot=""[^>]*>/)?.[0] ?? "";
  const input = html.match(/<input[^>]*name="_gotcha"[^>]*>/)?.[0] ?? "";

  assert.match(wrapper, /aria-hidden="true"/);
  assert.match(wrapper, /\sinert=""/);
  assert.match(wrapper, /-left-\[10000px\]/);
  assert.match(input, /tabindex="-1"/);
  assert.match(input, /autoComplete="off"|autocomplete="off"/);
  assert.doesNotMatch(input, /required/);
  assert.doesNotMatch(html, /name="website"/);
});

test("FRONTEND-3: the server markup keeps native validation for no-JS visitors", () => {
  // noValidate is set by a ref once the script runs; without JavaScript
  // the browser still checks the fields before posting to Formspree.
  const html = renderToStaticMarkup(
    h(ContactForm, { content: contactContent.tr, formId: "test" }),
  );
  assert.doesNotMatch(html.match(/<form[^>]*>/)?.[0] ?? "", /novalidate/i);
});

test("without JavaScript the form posts to Formspree, never to the page itself", () => {
  const configured = renderToStaticMarkup(
    h(ContactForm, { content: contactContent.tr, formId: "xyzAB_12" }),
  );
  const form = configured.match(/<form[^>]*>/)?.[0] ?? "";
  assert.match(form, /action="https:\/\/formspree\.io\/f\/xyzAB_12"/);
  assert.match(form, /method="post"/);

  const unconfigured = renderToStaticMarkup(
    h(ContactForm, { content: contactContent.tr, formId: "bad/id" }),
  );
  assert.doesNotMatch(unconfigured.match(/<form[^>]*>/)?.[0] ?? "", /action=/);
});
