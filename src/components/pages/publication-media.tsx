import Image from "next/image";
import { cx } from "@/components/ui/cx";
import type { CreditInfo } from "@/components/ui/Figure";
import { getImageCredit } from "@/content/media";

/**
 * Credit for an image whose credit is one free-text line (the Media
 * "Kaynak / telif" field, a cover credit from getImageCredit()). The line is
 * shown exactly as the editor wrote it, without a "Fotoğraf:" prefix; null
 * when there is nothing to credit.
 */
export function creditFromText(
  text: string | null | undefined,
): CreditInfo | null {
  const value = text?.trim();
  return value ? { collection: value } : null;
}

/**
 * Credit for a cover or content image with structured credit fields
 * (explicit credit, else owner or source and licence; getImageCredit()).
 */
export function creditFromImage(image: {
  credit?: string;
  copyrightOwner?: string;
  source?: string;
  license?: string;
}): CreditInfo | null {
  return creditFromText(getImageCredit(image));
}

/**
 * `lang` for an image whose alt text is in another language than the page
 * (a Turkish media alt on an English page, WCAG 3.1.2).
 */
export function altLanguageAttribute(
  altLanguage: string | undefined,
  pageLanguage: string,
): { lang?: string } {
  return altLanguage !== undefined && altLanguage !== pageLanguage
    ? { lang: altLanguage }
    : {};
}

type PublicationImageProps = {
  src: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  sizes: string;
  /** Language of the alt text when it differs from the page's. */
  lang?: string;
  /**
   * `fill` covers a sized parent (card media). `intrinsic` keeps the
   * image's own ratio, or a 16:9 frame when its size is unknown.
   */
  layout?: "intrinsic" | "fill";
  fit?: "cover" | "contain";
  /** The page's LCP image: preloaded in the document head. */
  preload?: boolean;
  className?: string;
};

/** next/image with the publication pages' sizing rules. */
export function PublicationImage({
  src,
  alt,
  width,
  height,
  sizes,
  lang,
  layout = "intrinsic",
  fit = "cover",
  preload = false,
  className,
}: PublicationImageProps) {
  const fitClassName = fit === "contain" ? "object-contain" : "object-cover";
  const hasSize =
    typeof width === "number" &&
    typeof height === "number" &&
    width > 0 &&
    height > 0;

  if (layout === "intrinsic" && hasSize) {
    return (
      <Image
        src={src}
        alt={alt}
        lang={lang}
        width={width}
        height={height}
        sizes={sizes}
        preload={preload}
        className={cx("block h-auto w-full", fitClassName, className)}
      />
    );
  }

  const image = (
    <Image
      src={src}
      alt={alt}
      lang={lang}
      fill
      sizes={sizes}
      preload={preload}
      className={cx(fitClassName, layout === "fill" && className)}
    />
  );

  return layout === "fill" ? (
    image
  ) : (
    <span
      className={cx(
        "relative block aspect-video overflow-hidden bg-band",
        className,
      )}
    >
      {image}
    </span>
  );
}
