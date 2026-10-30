/**
 * DistrictPhoto: next/image does not render under tsx, so the component is
 * called directly and its element tree is walked without rendering.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import type { PublicPhoto } from "@/content/photos/types";
import { DistrictPhoto, districtPhotoLoading } from "./district-guide-parts";

function photo(overrides: Partial<PublicPhoto> = {}): PublicPhoto {
  return {
    id: "p1",
    language: "tr",
    title: "Bomonti Bira Fabrikası",
    slug: "bomonti-bira-fabrikasi",
    description: null,
    image: { src: "/api/media/file/bomonti.jpg", alt: "Bomonti" },
    collections: [],
    tags: [],
    takenAt: "2026-03-12T09:00:00.000Z",
    locationName: null,
    district: "sisli",
    neighborhood: "Bomonti",
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
    publishedAt: "2026-03-13T00:00:00.000Z",
    createdAt: "2026-03-13T00:00:00.000Z",
    updatedAt: "2026-03-13T00:00:00.000Z",
    seo: { title: "", description: "", openGraphImage: null },
    ...overrides,
  };
}

type Props = Record<string, unknown>;

function propsOf(element: ReactElement): Props {
  const props: unknown = element.props;
  return typeof props === "object" && props !== null ? { ...props } : {};
}

/** Every element of a tree, props included, without rendering it. */
function elements(node: ReactNode): ReactElement[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement(node)) return [];
  const props = propsOf(node);
  return [
    node,
    ...Object.values(props).flatMap((value) =>
      isValidElement(value) || Array.isArray(value) ? elements(value) : [],
    ),
  ];
}

function figure(photoValue: PublicPhoto, priority?: boolean) {
  return elements(
    DistrictPhoto({
      photo: photoValue,
      sizes: "100vw",
      ...(priority === undefined ? {} : { priority }),
    }),
  );
}

const imageOf = (tree: ReactElement[]) =>
  tree
    .map(propsOf)
    .find((props) => props.src === "/api/media/file/bomonti.jpg");

test("LCP-PRIORITY: the hero photo loads eagerly at high priority, without preload", () => {
  const hero = imageOf(figure(photo(), true));
  assert.ok(hero);
  assert.equal(hero.loading, "eager");
  assert.equal(hero.fetchPriority, "high");
  // next/image: preload together with loading/fetchPriority is discouraged.
  assert.equal(hero.preload, undefined);
  assert.equal(hero.priority, undefined);
});

test("LCP-PRIORITY: gallery photos stay lazy with the default priority", () => {
  const gallery = imageOf(figure(photo()));
  assert.ok(gallery);
  assert.equal(gallery.loading, "lazy");
  assert.equal(gallery.fetchPriority, undefined);
  assert.deepEqual(districtPhotoLoading(false), { loading: "lazy" });
});

test("GALLERY-LINKS: every district photo links to its own photo page", () => {
  const links = figure(photo())
    .map(propsOf)
    .filter((props) => typeof props.href === "string");
  const detail = links.find(
    (props) => props.href === "/fotograflar/bomonti-bira-fabrikasi",
  );
  assert.ok(detail, "the caption links to the photo page");
  assert.equal(detail.children, "Bomonti Bira Fabrikası");

  // A historical archive photo links too, and an English photo to /en.
  const english = figure(
    photo({ language: "en", districtPhotoCategory: "tarih" }),
  )
    .map(propsOf)
    .some((props) => props.href === "/en/photography/bomonti-bira-fabrikasi");
  assert.ok(english);
});

test("GALLERY-LINKS: an untitled photo still gets a named link", () => {
  const link = figure(photo({ title: "  " }))
    .map(propsOf)
    .find((props) => props.href === "/fotograflar/bomonti-bira-fabrikasi");
  assert.ok(link);
  assert.equal(link.children, "Fotoğrafın sayfası");
});
