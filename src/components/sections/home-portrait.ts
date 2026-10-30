import type { CreditInfo } from "@/components/ui/Figure";
import type { AboutContent } from "@/content/homeContent";
import type {
  PublicHomeAboutBlock,
  PublicPage,
} from "@/content/pages/public-types";

/**
 * Credit of the "Hakkımda" portrait. When the CMS home supplies the
 * portrait, its media "Kaynak / telif" line is shown. The built-in
 * portrait has no recorded source, so it gets none (null): a credit is
 * never invented.
 */
export function getPortraitCredit(
  page: PublicPage | null,
  about: AboutContent,
): CreditInfo | null {
  if (page === null || about.imageSrc === undefined) return null;

  const block = page.layout.find(
    (item): item is PublicHomeAboutBlock =>
      item.blockType === "homeAbout" && item.visible,
  );
  const image = block?.image;
  if (image === null || image === undefined || image.src !== about.imageSrc) {
    return null;
  }

  const credit = image.credit?.trim();
  return credit ? { collection: credit } : null;
}
