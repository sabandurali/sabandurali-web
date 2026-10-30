import assert from "node:assert/strict";
import test from "node:test";
import {
  createFallbackMetaDescription,
  createFallbackMetaTitle,
} from "@/lib/metadata";
import { buildSeoPreview, isSeoPreviewKind } from "./seo-preview";

const base = {
  fallbackDescriptions: [],
  locale: "tr",
  metaDescription: "",
  metaTitle: "",
  slug: "",
  socialImage: null,
  title: "",
} as const;

test("ADM-SEO-PREVIEW: empty SEO fields show the public fallbacks", () => {
  const excerpt =
    "Kadıköy’ün ulaşım ağı yıllar içinde değişti. Bu araştırma, metro, vapur ve otobüs hatlarının mahallelere etkisini resmî kaynaklarla karşılaştırıyor ve sonuçları tek tabloda özetliyor.";
  const preview = buildSeoPreview("articles", {
    ...base,
    fallbackDescriptions: [excerpt],
    slug: "kadikoy-ulasim",
    title: "Kadıköy ulaşımı",
  });
  assert.equal(preview.title, createFallbackMetaTitle("Kadıköy ulaşımı"));
  assert.equal(preview.title, "Kadıköy ulaşımı | Şaban Durali");
  assert.equal(preview.titleFromSeoField, false);
  assert.equal(preview.description, createFallbackMetaDescription(excerpt));
  assert.ok(preview.descriptionLength <= preview.descriptionLimit);
  assert.equal(preview.descriptionFromSeoField, false);
  assert.equal(
    preview.url,
    "https://www.sabandurali.com/makaleler/kadikoy-ulasim",
  );
  assert.match(preview.imageNote, /varsayılan/);
});

test("ADM-SEO-PREVIEW: SEO fields the editor wrote win and are counted", () => {
  const preview = buildSeoPreview("articles", {
    ...base,
    canonical: "/makaleler/ana-kaynak",
    fallbackDescriptions: ["Özet"],
    locale: "en",
    metaDescription: "  Custom description  ",
    metaTitle: "A".repeat(61),
    slug: "english-slug",
    socialImage: "media-1",
    title: "Title",
  });
  assert.equal(preview.title, "A".repeat(61));
  assert.equal(preview.titleFromSeoField, true);
  assert.equal(preview.titleLength, 61);
  assert.equal(preview.titleLimit, 60);
  assert.equal(preview.description, "Custom description");
  // The canonical field overrides the record's own address.
  assert.equal(preview.url, "https://www.sabandurali.com/makaleler/ana-kaynak");
  assert.match(preview.imageNote, /öne çıkan/);
});

test("ADM-SEO-PREVIEW: photos fall back to the caption, then the alt text", () => {
  const withoutCaption = buildSeoPreview("photos", {
    ...base,
    fallbackDescriptions: [null, "Galata Kulesi gün batımında"],
    locale: "en",
    slug: "galata",
    title: "Galata",
  });
  assert.equal(withoutCaption.description, "Galata Kulesi gün batımında");
  assert.equal(
    withoutCaption.url,
    "https://www.sabandurali.com/en/photography/galata",
  );
  assert.match(withoutCaption.imageNote, /fotoğrafın kendisi/);
});

test("ADM-SEO-PREVIEW: pages use their own language and type for the address", () => {
  const page = { ...base, slug: "hakkinda-ek", title: "Sayfa" };
  assert.equal(
    buildSeoPreview("pages", { ...page, language: "tr", pageType: "standard" })
      .url,
    "https://www.sabandurali.com/hakkinda-ek",
  );
  assert.equal(
    buildSeoPreview("pages", { ...page, language: "en", pageType: "home" }).url,
    "https://www.sabandurali.com/en",
  );
  assert.equal(
    buildSeoPreview("pages", { ...page, language: "en", pageType: "standard" })
      .url,
    null,
  );
  const empty = buildSeoPreview("pages", base);
  assert.equal(empty.title, null);
  assert.equal(empty.description, null);
  assert.equal(empty.titleLength, 0);
  assert.ok(isSeoPreviewKind("pages"));
  assert.ok(!isSeoPreviewKind("books"));
});

test("ADM-SEO-PREVIEW: a canonical outside the site is ignored like on the public page", () => {
  for (const canonical of [
    "https://example.com/elsewhere",
    "//example.com/elsewhere",
    "/makaleler/x?utm=1",
  ]) {
    const preview = buildSeoPreview("articles", {
      ...base,
      canonical,
      fallbackDescriptions: ["Özet"],
      locale: "tr",
      slug: "kendi-adresi",
      title: "Başlık",
    });
    assert.equal(
      preview.url,
      "https://www.sabandurali.com/makaleler/kendi-adresi",
      canonical,
    );
  }
});
