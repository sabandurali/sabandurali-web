import assert from "node:assert/strict";
import test from "node:test";
import { getImageCredit, mapMediaImage } from "./media";
import { mediaDocument } from "./rich-text/lexical-fixtures";

test("media images carry alt, size, caption (Turkish only) and credit", () => {
  assert.deepEqual(
    mapMediaImage(mediaDocument, { fallbackAlt: "x", locale: "tr" }),
    {
      src: mediaDocument.url,
      alt: mediaDocument.alt,
      width: 1600,
      height: 900,
      caption: mediaDocument.description,
      credit: mediaDocument.sourceCopyright,
    },
  );
  assert.equal(
    mapMediaImage(mediaDocument, { fallbackAlt: "x", locale: "en" })?.caption,
    null,
  );
  assert.equal(
    mapMediaImage(
      { ...mediaDocument, alt: "" },
      { alt: " ", fallbackAlt: "Yedek", locale: "tr" },
    )?.alt,
    "Yedek",
  );
});

test("only safe, servable images are mapped", () => {
  for (const value of [
    null,
    "media-1",
    { ...mediaDocument, mimeType: "application/pdf" },
    { ...mediaDocument, mimeType: undefined },
    { ...mediaDocument, url: "/media/kadikoy.jpg" },
    { ...mediaDocument, url: "/api/media/file/a.jpg?x=1" },
    { ...mediaDocument, url: "https://example.org/a.jpg" },
  ]) {
    assert.equal(
      mapMediaImage(value, { fallbackAlt: "x", locale: "tr" }),
      null,
    );
  }
});

test("cover credits fall back to owner or source plus licence", () => {
  assert.equal(getImageCredit({ credit: "Explicit" }), "Explicit");
  assert.equal(
    getImageCredit({
      source: "Arşiv",
      copyrightOwner: "Şaban Durali",
      license: "Tüm hakları saklıdır",
    }),
    "Şaban Durali · Tüm hakları saklıdır",
  );
  assert.equal(getImageCredit({ source: "Arşiv" }), "Arşiv");
  assert.equal(getImageCredit({}), null);
});
