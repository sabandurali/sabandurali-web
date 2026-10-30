/**
 * The Turkish photographs on the empty English list. next/image does not
 * render under tsx, so the components are called directly and their
 * element trees are walked without rendering.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isValidElement, type ReactElement } from "react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import type { PublicPhoto } from "@/content/photos/types";
import PhotoCard from "./PhotoCard";
import PhotoLanguageFallback from "./PhotoLanguageFallback";

function photo(id: string, language: "tr" | "en" = "tr"): PublicPhoto {
  return {
    id,
    language,
    title: `Galata ${id}`,
    slug: `galata-${id}`,
    description: null,
    image: { src: `/api/media/file/${id}.jpg`, alt: "Galata Kulesi" },
    collections: [],
    tags: [],
    takenAt: null,
    locationName: null,
    district: null,
    neighborhood: null,
    districtPhotoCategory: null,
    dayPeriod: null,
    photographer: "Şaban Durali",
    creditLicense: null,
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
    updatedAt: "2026-06-01T09:00:00.000Z",
    seo: { title: "", description: "", openGraphImage: null },
  };
}

function elements(node: unknown): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  const props = node.props;
  return [
    node,
    ...elements(props.children),
    ...elements(props.eyebrow),
    ...elements(props.credit),
  ];
}

function texts(node: unknown): string[] {
  if (typeof node === "string") return [node];
  if (Array.isArray(node)) return node.flatMap(texts);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return texts(node.props.children);
}

test("EN-PHOTO-FALLBACK: a Turkish card on the English list is marked Turkish", () => {
  const card = PhotoCard({ photo: photo("1"), pageLanguage: "en" });
  assert.equal(card.type, Card);
  assert.equal(card.props.href, "/fotograflar/galata-1");
  assert.equal(card.props.hrefLang, "tr");
  const badge = elements(card).find((element) => element.type === Badge);
  assert.ok(badge);
  const label = elements(badge).find((element) => element.type === "span");
  assert.equal(label?.props.lang, "en");
  assert.deepEqual(texts(badge), ["In Turkish"]);
});

test("EN-PHOTO-FALLBACK: a card in the page language has no badge or hrefLang", () => {
  for (const card of [
    PhotoCard({ photo: photo("1") }),
    PhotoCard({ photo: photo("1", "en"), pageLanguage: "en" }),
  ]) {
    assert.equal(card.props.hrefLang, undefined);
    assert.equal(
      elements(card).some((element) => element.type === Badge),
      false,
    );
  }
});

test("EN-PHOTO-FALLBACK: the fallback says the photos are Turkish and marks each card", () => {
  const tree = PhotoLanguageFallback({
    locale: "en",
    photos: [photo("1"), photo("2")],
  });
  const all = elements(tree);
  assert.ok(texts(tree).some((text) => text.includes("published in Turkish")));
  const items = all.filter((element) => element.type === "li");
  assert.deepEqual(
    items.map((item) => item.props.lang),
    ["tr", "tr"],
  );
  const cards = all.filter((element) => element.type === PhotoCard);
  assert.deepEqual(
    cards.map((card) => card.props.pageLanguage),
    ["en", "en"],
  );
  assert.equal(PhotoLanguageFallback({ locale: "en", photos: [] }), null);
});

test("EN-PHOTO-FALLBACK: the list page shows the fallback instead of 'no photographs'", () => {
  const source = readFileSync(
    new URL("./PhotoListPage.tsx", import.meta.url),
    "utf8",
  );
  assert.match(
    source,
    /shouldShowTurkishPhotoFallback\(locale, filters, result\)\s*\?\s*await getTurkishFallbackPhotos\(\)/,
  );
  assert.match(
    source,
    /result\.photos\.length === 0 && fallback\.length > 0 \? \(\s*<PhotoLanguageFallback locale=\{locale\} photos=\{fallback\} \/>/,
  );
});
