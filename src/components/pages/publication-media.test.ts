/**
 * PublicationImage: next/image does not render under tsx, so the component
 * is called directly and the props it hands to next/image are read.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isValidElement } from "react";
import { PublicationImage, publicationImageLoading } from "./publication-media";

function propsOf(element: unknown): Record<string, unknown> {
  if (!isValidElement(element)) return {};
  const props: unknown = element.props;
  return typeof props === "object" && props !== null ? { ...props } : {};
}

/** The next/image element, also when it sits inside the 16:9 frame. */
function imageProps(element: unknown): Record<string, unknown> {
  const props = propsOf(element);
  return isValidElement(props.children) ? propsOf(props.children) : props;
}

const base = { src: "/media/cover.jpg", alt: "Kapak", sizes: "100vw" };

test("LCP-PRIORITY-READING: a priority image loads eagerly at high priority", () => {
  for (const sized of [
    { width: 800, height: 1200 },
    { width: null, height: null },
  ]) {
    const props = imageProps(
      PublicationImage({ ...base, ...sized, priority: true }),
    );
    assert.equal(props.loading, "eager");
    assert.equal(props.fetchPriority, "high");
    assert.equal(props.preload, false);
  }
});

test("LCP-PRIORITY-READING: other images keep the lazy default", () => {
  const props = imageProps(
    PublicationImage({ ...base, width: 800, height: 1200 }),
  );
  assert.equal(props.loading, undefined);
  assert.equal(props.fetchPriority, undefined);
  assert.deepEqual(publicationImageLoading(false), {});
});

test("LCP-PRIORITY-READING: the article hero and the book cover are the priority images", () => {
  for (const file of [
    "../articles/ArticleDetailPage.tsx",
    "../books/BookReviewDetailPage.tsx",
  ]) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    const images = [...source.matchAll(/<PublicationImage\b([\s\S]*?)\/>/g)];
    assert.equal(images.length, 1, file);
    const attributes = images[0]?.[1] ?? "";
    assert.match(attributes, /^\s*priority$/m, file);
    assert.doesNotMatch(attributes, /^\s*preload$/m, file);
  }
});
