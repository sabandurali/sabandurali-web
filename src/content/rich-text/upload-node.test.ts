import assert from "node:assert/strict";
import test from "node:test";
import { mediaDocument, upload } from "./lexical-fixtures";
import { getRichTextUpload } from "./upload-node";

test("toolbar uploads with fields: null and {} are images", () => {
  for (const fields of [null, {}]) {
    const result = getRichTextUpload(upload(mediaDocument, fields));

    assert.deepEqual(result, {
      ok: true,
      upload: {
        kind: "image",
        src: mediaDocument.url,
        alt: mediaDocument.alt,
        altLanguage: "tr",
        width: 1600,
        height: 900,
        caption: mediaDocument.description,
        credit: mediaDocument.sourceCopyright,
      },
    });
  }
});

test("a node-level alt text wins over the media alt text", () => {
  const result = getRichTextUpload(
    upload(mediaDocument, { alt: "Bu bağlamdaki açıklama" }),
  );

  assert.ok(result.ok && result.upload.kind === "image");
  assert.equal(result.upload.alt, "Bu bağlamdaki açıklama");
  // The node's own alt is in the document's language, not marked Turkish.
  assert.equal(result.upload.altLanguage, undefined);
});

test("missing dimensions, caption and credit are null", () => {
  const result = getRichTextUpload(
    upload({
      id: "m2",
      url: "/api/media/file/plain.png",
      mimeType: "image/png",
      alt: "Plan",
    }),
  );

  assert.ok(result.ok && result.upload.kind === "image");
  assert.equal(result.upload.width, null);
  assert.equal(result.upload.height, null);
  assert.equal(result.upload.caption, null);
  assert.equal(result.upload.credit, null);
});

test("PDF uploads become download links", () => {
  const result = getRichTextUpload(
    upload({
      id: "m3",
      url: "/api/media/file/rapor.pdf",
      mimeType: "application/pdf",
      filename: "rapor.pdf",
      alt: "Rapor",
    }),
  );

  assert.deepEqual(result, {
    ok: true,
    upload: {
      kind: "file",
      src: "/api/media/file/rapor.pdf",
      label: "rapor.pdf",
    },
  });
});

test("unpopulated, unsafe and unsupported uploads are reported, not thrown", () => {
  assert.deepEqual(getRichTextUpload(upload("media-1")), {
    ok: false,
    reason: "media relationship is not populated",
  });
  assert.equal(
    getRichTextUpload(
      upload({ ...mediaDocument, url: "https://evil.example/x.jpg" }),
    ).ok,
    false,
  );
  assert.deepEqual(
    getRichTextUpload(upload({ ...mediaDocument, mimeType: "video/mp4" })),
    { ok: false, reason: "unsupported MIME type", detail: "video/mp4" },
  );
  assert.equal(getRichTextUpload(null).ok, false);
});
