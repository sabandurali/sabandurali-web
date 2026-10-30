import assert from "node:assert/strict";
import test from "node:test";
import { getImageCredit, mapMediaImage, splitCreditRecord } from "./media";
import { mediaDocument } from "./rich-text/lexical-fixtures";

test("media images carry alt, size, caption (Turkish only) and credit", () => {
  assert.deepEqual(
    mapMediaImage(mediaDocument, { fallbackAlt: "x", locale: "tr" }),
    {
      src: mediaDocument.url,
      alt: mediaDocument.alt,
      altLanguage: "tr",
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

test("the media alt text is Turkish; a localized alt or the fallback is not", () => {
  assert.equal(
    mapMediaImage(mediaDocument, { fallbackAlt: "x", locale: "en" })
      ?.altLanguage,
    "tr",
  );
  assert.equal(
    mapMediaImage(mediaDocument, {
      alt: "Kadıköy pier",
      fallbackAlt: "x",
      locale: "en",
    })?.altLanguage,
    "en",
  );
  assert.equal(
    mapMediaImage(
      { ...mediaDocument, alt: "" },
      { fallbackAlt: "Article title", locale: "en" },
    )?.altLanguage,
    "en",
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

test("PHOTO-DETAIL-POLISH: an archive credit is split from its record link", () => {
  assert.deepEqual(
    splitCreditRecord(
      "Kamu malı · Kaynak kaydı: https://commons.wikimedia.org/wiki/File:Kad%C4%B1k%C3%B6y.jpg",
    ),
    {
      text: "Kamu malı",
      recordUrl:
        "https://commons.wikimedia.org/wiki/File:Kad%C4%B1k%C3%B6y.jpg",
    },
  );
  assert.deepEqual(splitCreditRecord("CC BY 4.0"), {
    text: "CC BY 4.0",
    recordUrl: null,
  });
  assert.deepEqual(splitCreditRecord("  "), { text: null, recordUrl: null });
  assert.deepEqual(splitCreditRecord(null), { text: null, recordUrl: null });
  // A record "link" that is not http(s) is never turned into a link.
  assert.deepEqual(
    splitCreditRecord("CC BY 4.0 · Kaynak kaydı: javascript:alert(1)"),
    { text: "CC BY 4.0", recordUrl: null },
  );
});
