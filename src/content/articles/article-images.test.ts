import assert from "node:assert/strict";
import test from "node:test";
import {
  getAvailablePublicArticleImage,
  getSafePayloadMediaPath,
} from "./article-images";
import { getSafeArticleHref } from "./article-links";

test("only Payload media paths and Vercel Blob URLs are accepted", () => {
  assert.equal(
    getSafePayloadMediaPath("/api/media/file/kadikoy.jpg"),
    "/api/media/file/kadikoy.jpg",
  );
  assert.equal(
    getSafePayloadMediaPath(
      "https://abc.public.blob.vercel-storage.com/kadikoy.jpg",
    ),
    "https://abc.public.blob.vercel-storage.com/kadikoy.jpg",
  );

  for (const value of [
    null,
    42,
    "/media/kadikoy.jpg",
    "/api/media/file/",
    "/api/media/file/../secret",
    "/api/media/file/a%2Fb.jpg",
    "/api/media/file/a.jpg?w=1",
    "/api/media/file/a.jpg#x",
    "/api/media/file/a\\b.jpg",
    "//evil.example/api/media/file/a.jpg",
    "http://abc.public.blob.vercel-storage.com/a.jpg",
    "https://blob.vercel-storage.com.evil.example/a.jpg",
    "/api/media/file/%E0%A4%A",
  ]) {
    assert.equal(getSafePayloadMediaPath(value), null, String(value));
  }
});

test("Payload images are re-validated before rendering", () => {
  assert.equal(
    getAvailablePublicArticleImage({
      source: "payload",
      src: "/api/media/file/a.jpg",
      alt: "",
    }),
    "/api/media/file/a.jpg",
  );
  assert.equal(
    getAvailablePublicArticleImage({
      source: "payload",
      src: "https://evil.example/a.jpg",
      alt: "",
    }),
    null,
  );
  assert.equal(getAvailablePublicArticleImage(null), null);
});

test("rich text links allow relative paths and http(s) only", () => {
  assert.equal(getSafeArticleHref("/makaleler/x"), "/makaleler/x");
  assert.equal(
    getSafeArticleHref("https://example.org/a b"),
    "https://example.org/a%20b",
  );
  assert.equal(getSafeArticleHref("//evil.example"), null);
  assert.equal(getSafeArticleHref("javascript:alert(1)"), null);
  assert.equal(getSafeArticleHref("mailto:a@b.co"), null);
  assert.equal(getSafeArticleHref("/relative", false), null);
  assert.equal(getSafeArticleHref(undefined), null);
});
