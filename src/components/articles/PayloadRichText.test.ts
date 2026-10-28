import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { createElement, isValidElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  heading,
  lexical,
  link,
  mediaDocument,
  paragraph,
  relationship,
  text,
  upload,
} from "../../content/rich-text/lexical-fixtures";
import PayloadRichText, { renderRichTextUpload } from "./PayloadRichText";

type RichTextData = ComponentProps<typeof PayloadRichText>["data"];

function isRichTextData(value: unknown): value is RichTextData {
  return typeof value === "object" && value !== null && "root" in value;
}

function render(t: TestContext, value: unknown) {
  const warnings = t.mock.method(console, "warn", () => {});
  const errors = t.mock.method(console, "error", () => {});

  assert.ok(isRichTextData(value));
  const html = renderToStaticMarkup(
    createElement(PayloadRichText, { data: value }),
  );

  return {
    html,
    warnings: warnings.mock.calls.map((call) => String(call.arguments[0])),
    errors: errors.mock.calls.map((call) => String(call.arguments[0])),
  };
}

// next/image cannot be rendered outside Next (CommonJS interop), so image
// uploads are checked on the element that the converter returns.
function figureParts(t: TestContext, node: unknown) {
  const errors = t.mock.method(console, "error", () => {});
  const element = renderRichTextUpload(node);

  assert.deepEqual(errors.mock.calls, []);
  assert.ok(isValidElement<{ children: unknown[] }>(element));
  assert.equal(element.type, "figure");
  const [media, caption] = element.props.children;
  assert.ok(isValidElement<Record<string, unknown>>(media));

  return {
    media,
    caption: isValidElement(caption) ? renderToStaticMarkup(caption) : null,
  };
}

for (const fields of [null, {}]) {
  test(`an upload with fields: ${JSON.stringify(fields)} renders its image, caption and credit`, (t) => {
    const { media, caption } = figureParts(t, upload(mediaDocument, fields));

    assert.equal(media.props.src, mediaDocument.url);
    assert.equal(media.props.alt, "Kadıköy rıhtımı");
    assert.equal(media.props.width, 1600);
    assert.equal(media.props.height, 900);
    assert.match(caption ?? "", /<span>Kadıköy iskelesi, sabah<\/span>/);
    assert.match(
      caption ?? "",
      /data-image-credit="">Şaban Durali · CC BY 4\.0</,
    );
  });
}

test("an image without dimensions uses a sized frame and no caption", (t) => {
  const { media, caption } = figureParts(
    t,
    upload({
      id: "m2",
      url: "/api/media/file/plain.png",
      mimeType: "image/png",
      alt: "Plan",
    }),
  );

  assert.equal(media.type, "span");
  assert.equal(caption, null);
});

test("the converter never throws on malformed upload nodes", (t) => {
  t.mock.method(console, "warn", () => {});

  for (const node of [
    null,
    {},
    upload(null),
    upload([]),
    upload(mediaDocument, null),
  ]) {
    assert.doesNotThrow(() => renderRichTextUpload(node));
  }
});

test("unpopulated uploads are skipped with a structured report", (t) => {
  const { html, warnings, errors } = render(t, lexical(upload("media-1")));

  assert.deepEqual(errors, []);
  assert.doesNotMatch(html, /<img/);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0] ?? "", /"scope":"rich-text"/);
  assert.match(warnings[0] ?? "", /upload node skipped/);
});

test("PDF uploads render as download links", (t) => {
  const { html } = render(
    t,
    lexical(
      upload({
        id: "m3",
        url: "/api/media/file/rapor.pdf",
        mimeType: "application/pdf",
        filename: "rapor.pdf",
        alt: "Rapor",
      }),
    ),
  );

  assert.match(
    html,
    /<a href="\/api\/media\/file\/rapor\.pdf"[^>]*><span>rapor\.pdf<\/span>/,
  );
});

test("resolved internal links and safe custom links render as anchors", (t) => {
  const { html, warnings } = render(
    t,
    lexical(
      paragraph(
        link(
          { linkType: "custom", newTab: false, url: "/makaleler/kadikoy" },
          "iç",
        ),
        link(
          { linkType: "custom", newTab: true, url: "https://example.org/" },
          "dış",
        ),
      ),
    ),
  );

  assert.match(html, /<a href="\/makaleler\/kadikoy"[^>]*>iç<\/a>/);
  assert.match(
    html,
    /<a href="https:\/\/example\.org\/" target="_blank" rel="noopener noreferrer"[^>]*>dış<\/a>/,
  );
  assert.deepEqual(warnings, []);
});

test("unresolved internal links and unsafe URLs keep only their text", (t) => {
  const { html, warnings } = render(
    t,
    lexical(
      paragraph(
        link({ linkType: "internal", newTab: false, doc: null }, "taslak"),
        link(
          { linkType: "custom", newTab: false, url: "javascript:alert(1)" },
          "zararlı",
        ),
        link(null, "alansız"),
      ),
    ),
  );

  assert.doesNotMatch(html, /<a /);
  assert.match(html, /taslak/);
  assert.match(html, /zararlı/);
  assert.match(html, /alansız/);
  assert.equal(warnings.length, 2);
  assert.match(warnings[0] ?? "", /internal link target is not public/);
  assert.match(warnings[1] ?? "", /URL is not safe/);
});

test("relationship blocks are explicitly unsupported", (t) => {
  const { html, warnings } = render(
    t,
    lexical(
      heading("h2", "Başlık"),
      relationship("a9"),
      paragraph(text("Gövde")),
    ),
  );

  assert.match(html, /<h2>Başlık<\/h2>/);
  assert.match(html, /<p>Gövde<\/p>/);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0] ?? "", /relationship node skipped/);
});

test("unknown node types are skipped with a report", (t) => {
  const { html, warnings } = render(
    t,
    lexical({ type: "mystery", version: 1 }, paragraph(text("Kalan"))),
  );

  assert.match(html, /Kalan/);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0] ?? "", /mystery node skipped/);
});
