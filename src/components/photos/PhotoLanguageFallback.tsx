import { cardGrids } from "@/components/pages/card-grid";
import PhotoCard from "@/components/photos/PhotoCard";
import { photoCopy } from "@/components/photos/photo-copy";
import type { SiteLocale } from "@/content/locales";
import type { PublicPhoto } from "@/content/photos/types";

/**
 * The photographs of another language on a list that has none of its own
 * (the Turkish photos on the English list): a note saying so, then the
 * cards. Each card is marked with its own language and a language badge,
 * and its link names the target language.
 */
export default function PhotoLanguageFallback({
  locale,
  photos,
}: {
  locale: SiteLocale;
  photos: readonly PublicPhoto[];
}) {
  if (photos.length === 0) return null;
  const copy = photoCopy[locale];

  return (
    <>
      <p className="m-0 mb-6 max-w-[52rem] type-body text-ink">
        {copy.turkishFallbackNote}
      </p>
      <ul className={cardGrids[3].className}>
        {photos.map((photo) => (
          <li
            key={photo.id}
            className="grid"
            lang={photo.language === locale ? undefined : photo.language}
          >
            <PhotoCard photo={photo} headingLevel="h3" pageLanguage={locale} />
          </li>
        ))}
      </ul>
    </>
  );
}
