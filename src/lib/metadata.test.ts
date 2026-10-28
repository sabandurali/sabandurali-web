import assert from "node:assert/strict";
import test from "node:test";
import { imageConfigDefault } from "next/dist/shared/lib/image-config.js";
import { ImageOptimizerCache } from "next/dist/server/image-optimizer.js";
import nextConfig from "../../next.config";
import { siteSocialImage } from "@/config/site";
import {
  createLanguageAlternates,
  createOptimizedSocialImage,
  createPageMetadata,
  createSocialImage,
  defaultSocialImage,
  metaDescriptionMaxLength,
  siteName,
  truncateMetaDescription,
} from "./metadata";

const site = "https://www.sabandurali.com";

test("hreflang pairs list both versions and default to Turkish", () => {
  assert.deepEqual(
    createLanguageAlternates({ tr: "/iletisim", en: "/en/contact" }),
    {
      "tr-TR": `${site}/iletisim`,
      en: `${site}/en/contact`,
      "x-default": `${site}/iletisim`,
    },
  );
});

test("a single language version gets a self hreflang and no x-default", () => {
  assert.deepEqual(createLanguageAlternates({ tr: "/hakkimda" }), {
    "tr-TR": `${site}/hakkimda`,
  });
  assert.deepEqual(createLanguageAlternates({ en: "/en/articles/a" }), {
    en: `${site}/en/articles/a`,
  });
});

test("page metadata always has canonical, hreflang, robots, OG and Twitter", () => {
  const metadata = createPageMetadata({
    title: "İletişim | Şaban Durali",
    description: "İletişim sayfası.",
    locale: "tr",
    path: "/iletisim",
    translations: { en: "/en/contact" },
  });

  assert.equal(metadata.title, "İletişim | Şaban Durali");
  assert.equal(metadata.description, "İletişim sayfası.");
  assert.deepEqual(metadata.alternates, {
    canonical: `${site}/iletisim`,
    languages: {
      "tr-TR": `${site}/iletisim`,
      en: `${site}/en/contact`,
      "x-default": `${site}/iletisim`,
    },
  });
  assert.deepEqual(metadata.robots, { index: true, follow: true });
  assert.deepEqual(metadata.openGraph, {
    title: "İletişim | Şaban Durali",
    description: "İletişim sayfası.",
    url: `${site}/iletisim`,
    siteName,
    locale: "tr_TR",
    alternateLocale: ["en_US"],
    images: [siteSocialImage],
    type: "website",
  });
  assert.deepEqual(metadata.twitter, {
    card: "summary_large_image",
    title: "İletişim | Şaban Durali",
    description: "İletişim sayfası.",
    images: [siteSocialImage],
  });
});

test("single-language pages have no alternate OG locale", () => {
  const metadata = createPageMetadata({
    title: "Hakkımda | Şaban Durali",
    description: "Hakkımda.",
    locale: "tr",
    path: "/hakkimda",
  });

  assert.deepEqual(metadata.alternates?.languages, {
    "tr-TR": `${site}/hakkimda`,
  });
  assert.equal(
    metadata.openGraph !== null &&
      metadata.openGraph !== undefined &&
      "alternateLocale" in metadata.openGraph,
    false,
  );
});

test("canonical override, robots, social copy, images and article fields", () => {
  const image = createSocialImage({ src: "/brand/x.jpg", alt: "X" });
  const metadata = createPageMetadata({
    title: "Article | Şaban Durali",
    description: "Description",
    locale: "en",
    path: "/en/articles/a",
    translations: { tr: "/makaleler/a" },
    canonical: "https://www.sabandurali.com/makaleler/a",
    images: [image],
    index: false,
    follow: false,
    socialTitle: "Share title",
    socialDescription: "Share description",
    article: {
      publishedTime: "2026-01-01T00:00:00.000Z",
      modifiedTime: "2026-02-01T00:00:00.000Z",
      authors: ["Şaban Durali"],
    },
  });

  assert.equal(metadata.alternates?.canonical, `${site}/makaleler/a`);
  assert.deepEqual(metadata.alternates?.languages, {
    "tr-TR": `${site}/makaleler/a`,
    en: `${site}/en/articles/a`,
    "x-default": `${site}/makaleler/a`,
  });
  assert.deepEqual(metadata.robots, { index: false, follow: false });
  assert.deepEqual(metadata.openGraph, {
    title: "Share title",
    description: "Share description",
    url: `${site}/makaleler/a`,
    siteName,
    locale: "en_US",
    alternateLocale: ["tr_TR"],
    images: [image],
    type: "article",
    publishedTime: "2026-01-01T00:00:00.000Z",
    modifiedTime: "2026-02-01T00:00:00.000Z",
    authors: ["Şaban Durali"],
  });
  assert.deepEqual(metadata.twitter, {
    card: "summary_large_image",
    title: "Share title",
    description: "Share description",
    images: [image],
  });
});

test("an empty image list falls back to the site image", () => {
  const metadata = createPageMetadata({
    title: "T",
    description: "D",
    locale: "tr",
    path: "/",
    images: [],
  });

  assert.deepEqual(metadata.twitter?.images, [defaultSocialImage]);
});

test("prepared social images are used as uploaded", () => {
  assert.deepEqual(
    createSocialImage({ src: "/api/media/file/share.jpg", alt: "Share" }),
    { url: `${site}/api/media/file/share.jpg`, alt: "Share" },
  );
  assert.deepEqual(
    createSocialImage({
      src: "https://store.public.blob.vercel-storage.com/share.jpg",
      alt: "Share",
      width: 1200,
      height: 630,
    }),
    {
      url: "https://store.public.blob.vercel-storage.com/share.jpg",
      alt: "Share",
      width: 1200,
      height: 630,
    },
  );
  assert.deepEqual(
    createSocialImage({ src: "/a.jpg", alt: "A", width: 0, height: 10 }),
    { url: `${site}/a.jpg`, alt: "A" },
  );
});

test("content images are resized to at most 1200 px by the image optimizer", () => {
  assert.deepEqual(
    createOptimizedSocialImage({
      src: "/workspaces/districts/esenler.jpg",
      alt: "Esenler",
      width: 4000,
      height: 3000,
    }),
    {
      url: `${site}/_next/image?url=%2Fworkspaces%2Fdistricts%2Fesenler.jpg&w=1200&q=75`,
      alt: "Esenler",
      width: 1200,
      height: 900,
    },
  );
  assert.deepEqual(
    createOptimizedSocialImage({
      src: "/api/media/file/small.jpg",
      alt: "Small",
      width: 800,
      height: 600,
    }),
    {
      url: `${site}/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fsmall.jpg&w=1200&q=75`,
      alt: "Small",
      width: 800,
      height: 600,
    },
  );
  assert.deepEqual(
    createOptimizedSocialImage({ src: "/api/media/file/x.jpg", alt: "X" }),
    {
      url: `${site}/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fx.jpg&w=1200&q=75`,
      alt: "X",
    },
  );
});

test("remote content images are not routed through the optimizer", () => {
  const remote = {
    src: "https://store.public.blob.vercel-storage.com/photo.jpg",
    alt: "Remote",
    width: 4000,
    height: 3000,
  };

  assert.deepEqual(createOptimizedSocialImage(remote), {
    url: remote.src,
    alt: "Remote",
    width: 4000,
    height: 3000,
  });
});

test("the image optimizer of this app accepts optimized social image URLs", () => {
  const images = { ...imageConfigDefault, ...nextConfig.images };
  const validate = (src: string) => {
    const optimized = new URL(createOptimizedSocialImage({ src, alt: "" }).url);
    assert.equal(optimized.pathname, images.path);
    // validateParams only reads req.headers.accept, config.images and
    // config.basePath, so partial objects stand in for the request and the
    // resolved Next.js config.
    return ImageOptimizerCache.validateParams(
      { headers: { accept: "*/*" } } as never,
      Object.fromEntries(optimized.searchParams),
      { ...nextConfig, images } as never,
      false,
    );
  };

  assert.ok((images.localPatterns ?? []).length > 0);
  for (const src of [
    "/workspaces/districts/esenler.jpg",
    "/workspaces/districts/kadikoy.jpg",
    "/api/media/file/photo.jpg",
  ]) {
    const result = validate(src);
    assert.equal("errorMessage" in result ? result.errorMessage : null, null);
    assert.equal("width" in result ? result.width : null, 1200);
  }
  // The same validation rejects what images.localPatterns does not allow.
  assert.ok(
    "errorMessage" in validate("/workspaces/districts/esenler.jpg?x=1"),
  );
  assert.ok("errorMessage" in validate("/media/not-allowed.jpg"));
});

test("meta descriptions keep whole sentences when they fit", () => {
  const text =
    "Birinci cümle kısa. İkinci cümle de kısa. Üçüncü cümle ise bu açıklamanın sınırını aşacak kadar uzun tutulmuş, fazladan kelimeler ve ayrıntılar içeren bir cümledir ve kesilmelidir.";
  assert.equal(
    truncateMetaDescription(text),
    "Birinci cümle kısa. İkinci cümle de kısa.",
  );
  assert.equal(truncateMetaDescription("  Kısa   metin. "), "Kısa metin.");
});

test("ordinals and regnal numbers are not sentence ends", () => {
  const text =
    "Bölge 19. yüzyılda II. Mahmut döneminde gelişen, liman ve çarşı çevresinde büyüyen, sonraki dönemlerde sanayi ve konut alanlarıyla genişleyen çok katmanlı bir yerleşimdir ve uzun bir geçmişe sahiptir.";
  const result = truncateMetaDescription(text);

  assert.ok(result.length <= metaDescriptionMaxLength);
  assert.ok(result.endsWith("…"));
  assert.ok(result.startsWith("Bölge 19. yüzyılda II. Mahmut döneminde"));
});

test("a long first sentence is cut at a word boundary with an ellipsis", () => {
  const text = `${"kelime ".repeat(40)}son.`;
  const result = truncateMetaDescription(text, 50);

  assert.ok(result.length <= 50);
  assert.match(result, /^(kelime )*kelime…$/);
  assert.equal(truncateMetaDescription("a, b, c, d, e, f, g", 8), "a, b, c…");
});
