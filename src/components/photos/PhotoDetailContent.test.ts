/**
 * The photo page body. The site shell reads the CMS navigation (server-only)
 * and next/image does not render under tsx, so PhotoDetailContent is called
 * directly and its element tree is walked without rendering.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement, isValidElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PhotoCardList } from "@/components/pages/PublicationCardLists";
import { Credit, Figure } from "@/components/ui/Figure";
import TextLink from "@/components/ui/TextLink";
import type { PublicPhoto } from "@/content/photos/types";
import PhotoDetailContent from "./PhotoDetailContent";
import { getPhotoCredit, getPhotoFacts } from "./photo-details";

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
  const data: unknown = JSON.parse(String(html));
  assert.ok(data !== null && typeof data === "object");
  assert.equal(Reflect.get(data, "@type"), "ImageObject");
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
    /<PublicationShell[\s\S]*<PhotoDetailContent \{\.\.\.props\} sameDistrict=\{sameDistrict\} \/>/,
  );
  assert.match(page, /getSameDistrictPhotos\(props\.photo, props\.related\)/);
});

const archiveCredit =
  "Kamu malı · Kaynak kaydı: https://commons.wikimedia.org/wiki/File:Kad%C4%B1k%C3%B6y_1900.jpg";

test("PHOTO-DETAIL-POLISH: an archive record is a short link, not a raw URL", () => {
  const archive = photo({
    photographer: "Arşiv",
    creditLicense: archiveCredit,
  });
  assert.deepEqual(getPhotoCredit(archive), {
    author: "Arşiv",
    licence: "Kamu malı",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Kad%C4%B1k%C3%B6y_1900.jpg",
    sourceLabel: "Kaynak kaydı",
  });
  assert.equal(
    getPhotoCredit({ ...archive, language: "en" }).sourceLabel,
    "Source record",
  );
  const licence = getPhotoFacts(archive).find(
    (item) => item.label === "Kredi / lisans",
  );
  assert.equal(licence?.value, "Kamu malı");

  const figure = elements(
    PhotoDetailContent({ photo: archive, translation: null, related: [] }),
  ).find((element) => element.type === Figure);
  assert.deepEqual(figure?.props.credit, getPhotoCredit(archive));
  // A plain licence keeps its text and gets no record link.
  assert.deepEqual(getPhotoCredit(photo()), {
    author: "Şaban Durali",
    licence: "CC BY 4.0",
  });
});

function textLinks(node: unknown) {
  return elements(node).filter((element) => element.type === TextLink);
}

test("PHOTO-DETAIL-POLISH: a photo of a district links to its guide", () => {
  const links = textLinks(
    PhotoDetailContent({
      photo: photo({ district: "kadikoy" }),
      translation: null,
      related: [],
    }),
  );
  const guide = links.find(
    (element) => element.props.href === "/istanbul/ilceler/kadikoy",
  );
  assert.ok(guide);
  assert.equal(guide.props.children, "Kadıköy ilçe rehberi");
  assert.equal(guide.props.hrefLang, undefined);

  const english = textLinks(
    PhotoDetailContent({
      photo: photo({ district: "kadikoy", language: "en" }),
      translation: null,
      related: [],
    }),
  ).find((element) => element.props.href === "/istanbul/ilceler/kadikoy");
  assert.equal(english?.props.hrefLang, "tr");
  assert.equal(english?.props.children, "Kadıköy district guide (in Turkish)");

  // No district, or one the registry does not know: no guide link.
  for (const district of [null, "atlantis"]) {
    const hrefs = textLinks(
      PhotoDetailContent({
        photo: photo({ district }),
        translation: null,
        related: [],
      }),
    ).map((element) => element.props.href);
    assert.deepEqual(hrefs, ["/fotograflar"]);
  }
});

test("PHOTO-DETAIL-POLISH: other photographs of the district get their own strip", () => {
  const neighbour = photo({ id: "photo-2", slug: "moda", district: "kadikoy" });
  const tree = elements(
    PhotoDetailContent({
      photo: photo({ district: "kadikoy" }),
      translation: null,
      related: [],
      sameDistrict: [neighbour],
    }),
  );
  const heading = tree.find(
    (element) => element.props.id === "same-district-photos-heading",
  );
  assert.equal(heading?.props.children, "Kadıköy ilçesinden fotoğraflar");
  const lists = tree.filter((element) => element.type === PhotoCardList);
  assert.deepEqual(
    lists.map((element) => element.props.photos),
    [[neighbour]],
  );

  const withoutDistrict = elements(
    PhotoDetailContent({
      photo: photo(),
      translation: null,
      related: [],
      sameDistrict: [neighbour],
    }),
  );
  assert.equal(
    withoutDistrict.some(
      (element) => element.props.id === "same-district-photos-heading",
    ),
    false,
  );
});

test("PHOTO-DETAIL-POLISH: the record link names itself and marks it external only visually", () => {
  const html = renderToStaticMarkup(
    createElement(Credit, {
      credit: getPhotoCredit(
        photo({ photographer: "Arşiv", creditLicense: archiveCredit }),
      ),
    }),
  );
  assert.match(
    html,
    /<a [^>]*href="https:\/\/commons\.wikimedia\.org\/wiki\/File:Kad%C4%B1k%C3%B6y_1900\.jpg"[^>]*>Kaynak kaydı<span aria-hidden="true"> ↗<\/span><\/a>/,
  );
  // The raw, URL-encoded address is never printed as text.
  assert.doesNotMatch(html, />[^<]*commons\.wikimedia/);
});
