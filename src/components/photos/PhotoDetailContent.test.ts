/**
 * The photo page body. The site shell reads the CMS navigation (server-only)
 * and next/image does not render under tsx, so PhotoDetailContent is called
 * directly and its element tree is walked without rendering.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isValidElement, type ReactElement } from "react";
import type { PublicPhoto } from "@/content/photos/types";
import PhotoDetailContent from "./PhotoDetailContent";

function photo(overrides: Partial<PublicPhoto> = {}): PublicPhoto {
  return {
    id: "photo-1",
    language: "tr",
    title: "Galata",
    slug: "galata",
    description: null,
    image: {
      src: "/api/media/file/galata.jpg",
      alt: "Galata Kulesi",
      width: 6000,
      height: 4000,
    },
    collections: [],
    tags: [],
    takenAt: null,
    locationName: null,
    district: null,
    neighborhood: null,
    districtPhotoCategory: null,
    dayPeriod: null,
    photographer: "Şaban Durali",
    creditLicense: "CC BY 4.0",
    exif: {
      camera: null,
      lens: null,
      focalLength: null,
      aperture: null,
      shutterSpeed: null,
      iso: null,
    },
    featured: false,
    publishedAt: "2026-06-01T09:00:00.000Z",
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-06-03T09:00:00.000Z",
    seo: { title: "", description: "Galata", openGraphImage: null },
    ...overrides,
  };
}

/** Every element in a tree, without rendering function components. */
function elements(node: unknown): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...elements(node.props.children)];
}

function content(related: PublicPhoto[] = []) {
  return PhotoDetailContent({ photo: photo(), translation: null, related });
}

test("SEO-PERF-1: the photo page renders its ImageObject JSON-LD", () => {
  const scripts = elements(content()).filter(
    (element) =>
      element.type === "script" && element.props.type === "application/ld+json",
  );
  assert.equal(scripts.length, 1);
  const inner: unknown = scripts[0]?.props.dangerouslySetInnerHTML;
  assert.ok(inner !== null && typeof inner === "object");
  const html: unknown = Reflect.get(inner, "__html");
  assert.equal(typeof html, "string");
  const parsed: unknown = JSON.parse(String(html));
  assert.ok(parsed !== null && typeof parsed === "object");
  // The ImageObject next to the page's BreadcrumbList.
  const graph: unknown = Reflect.get(parsed, "@graph");
  assert.ok(Array.isArray(graph));
  const data: unknown = graph.find(
    (node: unknown) =>
      typeof node === "object" &&
      node !== null &&
      Reflect.get(node, "@type") === "ImageObject",
  );
  assert.ok(data !== null && typeof data === "object");
  assert.equal(
    Reflect.get(data, "url"),
    "https://www.sabandurali.com/fotograflar/galata",
  );
  assert.equal(Reflect.get(data, "copyrightNotice"), "CC BY 4.0");
  assert.equal(Reflect.get(data, "dateModified"), "2026-06-03T09:00:00.000Z");
});

test("the photo page renders PhotoDetailContent inside the site shell", () => {
  const page = readFileSync(
    new URL("./PhotoDetailPage.tsx", import.meta.url),
    "utf8",
  );
  assert.match(
    page,
    /<PublicationShell[\s\S]*<PhotoDetailContent \{\.\.\.props\} \/>/,
  );
});
