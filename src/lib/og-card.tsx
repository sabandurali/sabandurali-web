import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { brandLogoOnDark, type BrandImage } from "@/config/brand";

/**
 * A generated 1200×630 share card in the "İstanbul Atlası" colours, for
 * pages without a photograph of their own. It names only what the page
 * itself states (a title, a region line, a kind of page); it never shows an
 * invented figure or image.
 *
 * Text is set in the font that `next/og` bundles (Geist), which draws every
 * Turkish letter (ı İ ş Ş ğ Ğ ç Ç ö Ö ü Ü; see og-card.test.ts).
 */
export type OgCardInput = {
  /** Small capitals line above the title, e.g. "İSTANBUL · AVRUPA YAKASI". */
  eyebrow: string;
  title: string;
  /** One line under the title, e.g. "İlçe Rehberi". */
  subtitle: string;
};

export const ogCardSize = { width: 1200, height: 630 } as const;

/**
 * The brand mark of the card's footer. It is the one place the site's
 * identity enters the card, so another brand passes its own `brand` without
 * touching the layout or the routes that use the card.
 *
 * The logo is a file of the identity package in `public/brand/`, embedded
 * as an image: the brand guide forbids redrawing the ŞD symbol or setting
 * the name in live text (SABAN_DURALI_BRAND_SYSTEM.md §1).
 */
export type OgCardBrand = {
  /** Left of the footer: a logo file for the sea ground. */
  logo: BrandImage;
  /** Right of the footer: the site address. */
  domain: string;
};

/**
 * Identity v1: the horizontal logo (ŞD symbol and name) in its
 * `-color-ondark` cut, the one the guide gives for the sea ground.
 */
export const defaultOgCardBrand: OgCardBrand = {
  logo: brandLogoOnDark,
  domain: "sabandurali.com",
};

/** Logo height on the card; 64 px keeps the horizontal logo over 500 px wide. */
export const ogCardLogoHeight = 64;

const imageTypes = new Map([
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
]);

const logoSources = new Map<string, string>();

/**
 * A brand file of `public/brand/` as a data URI for the `next/og` `<img>`
 * (read once from the project root, as the Next.js docs show for local
 * assets). Anything outside `/brand/` or of another type is refused.
 */
export function getOgBrandImageSource(image: BrandImage): string {
  const cached = logoSources.get(image.src);
  if (cached !== undefined) return cached;
  const type = imageTypes.get(path.extname(image.src));
  if (!/^\/brand\/[a-z0-9-]+\.(svg|png)$/.test(image.src) || !type) {
    throw new Error(`Not a brand file: ${image.src}`);
  }
  const data = readFileSync(
    path.join(process.cwd(), "public", image.src),
    "base64",
  );
  const source = `data:${type};base64,${data}`;
  logoSources.set(image.src, source);
  return source;
}

/** Tokens of src/app/globals.css (`--color-sea`, `--color-signal`, …). */
const colors = {
  sea: "#0a3352",
  onSea: "#ffffff",
  onSeaSoft: "#dce7ec",
  onSeaMuted: "#b9d0df",
  seaLine: "#2c5577",
  signal: "#f47a2e",
} as const;

/** Title size steps so a long district name still fits on one or two lines. */
export function getOgTitleSize(title: string): number {
  const length = [...title].length;
  if (length <= 10) return 128;
  if (length <= 16) return 104;
  if (length <= 26) return 84;
  return 64;
}

export function OgCard({
  eyebrow,
  title,
  subtitle,
  brand = defaultOgCardBrand,
}: OgCardInput & { brand?: OgCardBrand }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: colors.sea,
        color: colors.onSea,
        padding: "72px 80px",
        borderLeft: `24px solid ${colors.signal}`,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 30,
          letterSpacing: 4,
          color: colors.onSeaMuted,
        }}
      >
        {eyebrow}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: getOgTitleSize(title),
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 44,
            color: colors.onSeaSoft,
          }}
        >
          {subtitle}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `2px solid ${colors.seaLine}`,
          paddingTop: 28,
          fontSize: 30,
          color: colors.onSeaSoft,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders <img>, not next/image */}
        <img
          src={getOgBrandImageSource(brand.logo)}
          alt=""
          width={Math.round(
            (brand.logo.width * ogCardLogoHeight) / brand.logo.height,
          )}
          height={ogCardLogoHeight}
        />
        <span>{brand.domain}</span>
      </div>
    </div>
  );
}

/** The card as a PNG response, cached like a static asset. */
export function createOgCard(
  input: OgCardInput,
  brand: OgCardBrand = defaultOgCardBrand,
): ImageResponse {
  return new ImageResponse(<OgCard {...input} brand={brand} />, {
    ...ogCardSize,
    headers: {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
