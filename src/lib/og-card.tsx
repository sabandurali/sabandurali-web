import { ImageResponse } from "next/og";

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
 * The brand mark of the card's footer: plain text today. It is the one
 * place the site's identity enters the card, so a later brand package
 * replaces this (or passes its own `brand`) without touching the layout or
 * the routes that use the card.
 */
export type OgCardBrand = {
  /** Left of the footer: the owner's name or a wordmark. */
  name: string;
  /** Right of the footer: the site address. */
  domain: string;
};

export const defaultOgCardBrand: OgCardBrand = {
  name: "Şaban Durali",
  domain: "sabandurali.com",
};

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
          borderTop: `2px solid ${colors.seaLine}`,
          paddingTop: 28,
          fontSize: 30,
          color: colors.onSeaSoft,
        }}
      >
        <span>{brand.name}</span>
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
