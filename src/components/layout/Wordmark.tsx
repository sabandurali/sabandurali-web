import Link from "next/link";
import {
  brandLogo,
  brandLogoAlt,
  brandLogoOnDark,
  brandNameMark,
} from "@/config/brand";
import { cx } from "@/components/ui/cx";
import {
  getShellStrings,
  localeHomePaths,
  type HeaderLocale,
} from "./header-content";

type WordmarkProps = {
  locale: HeaderLocale;
  /** `on-sea` for the footer. */
  tone?: "ink" | "on-sea";
  /** A link to the home page (header) or plain text (footer). */
  asLink?: boolean;
  className?: string;
};

/**
 * The identity v1 logo (brand/saban-durali-kimlik-v1/), shown from its SVG
 * files and never redrawn with text. On paper the horizontal logo is 36 px
 * high (285 px wide, above its 200 px minimum, with the x clear space inside
 * the 72 px header row); below 640 px, where it would crowd the menu, the
 * name-only wordmark takes its place at 18 px (174 px wide, minimum 110 px;
 * it may shrink a little below 360 px rather than push the menu off screen).
 * On sea (footer) the `-color-ondark` horizontal logo, 36 px high.
 *
 * The image's alt starts with the visible name ("Şaban Durali, Araştırma ve
 * Bilgi Platformu"), and as a link the home-page suffix follows it (WCAG
 * 2.5.3). The tagline inside the files is Turkish; the alt is in the page
 * language.
 */
export default function Wordmark({
  locale,
  tone = "ink",
  asLink = true,
  className,
}: WordmarkProps) {
  const alt = brandLogoAlt[locale];

  const image =
    tone === "on-sea" ? (
      // An SVG, served as is (no optimizer, so no next/image); one file at
      // every width. Lazy: the footer is far below the first screen.
      <picture>
        <img
          src={brandLogoOnDark.src}
          alt={alt}
          width={brandLogoOnDark.width}
          height={brandLogoOnDark.height}
          loading="lazy"
          decoding="async"
          className="block h-9 w-auto"
        />
      </picture>
    ) : (
      // Art direction: the browser downloads only the file its width needs.
      <picture>
        <source
          media="(min-width: 40rem)"
          srcSet={brandLogo.src}
          width={brandLogo.width}
          height={brandLogo.height}
        />
        <img
          src={brandNameMark.src}
          alt={alt}
          width={brandNameMark.width}
          height={brandNameMark.height}
          // In the first row of every page: fetched with the page, not after
          // the layout pass that would otherwise raise its priority.
          fetchPriority="high"
          decoding="async"
          className="block h-4.5 w-auto sm:h-9"
        />
      </picture>
    );
  const classes = cx("inline-flex min-h-tap items-center", className);

  if (!asLink) {
    return <p className={cx("m-0", classes)}>{image}</p>;
  }

  return (
    <Link
      href={localeHomePaths[locale]}
      className={cx(classes, "no-underline")}
    >
      {image}
      <span className="sr-only">, {getShellStrings(locale).homeLink}</span>
    </Link>
  );
}
