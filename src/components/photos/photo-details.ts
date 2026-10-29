import type { MetaItem } from "@/components/pages/MetaList";
import { publicationCopy } from "@/components/pages/publication-copy";
import type { CreditInfo } from "@/components/ui/Figure";
import type { PublicPhoto } from "@/content/photos/types";
import { formatDate, toDateTimeAttribute } from "@/lib/format-date";

/**
 * Credit of a published photograph: the photographer (always set) and the
 * credit / licence line when the editor entered one.
 */
export function getPhotoCredit(photo: PublicPhoto): CreditInfo {
  const photographer = photo.photographer.trim();
  const licence = photo.creditLicense?.trim();

  return {
    ...(photographer === "" ? {} : { author: photographer }),
    ...(licence ? { licence } : {}),
  };
}

/** Location, date taken, photographer and licence of a photograph. */
export function getPhotoFacts(photo: PublicPhoto): MetaItem[] {
  const text = publicationCopy[photo.language].photos;
  const takenAt = formatDate(photo.takenAt, photo.language);
  const facts: MetaItem[] = [];

  if (photo.locationName !== null) {
    facts.push({ label: text.location, value: photo.locationName });
  }
  if (takenAt !== null) {
    facts.push({
      label: text.date,
      value: takenAt,
      dateTime: toDateTimeAttribute(photo.takenAt),
      data: true,
    });
  }
  facts.push({ label: text.photographer, value: photo.photographer });
  if (photo.creditLicense !== null) {
    facts.push({ label: text.licence, value: photo.creditLicense });
  }

  return facts;
}

/** EXIF values the photograph carries, in camera order. */
export function getPhotoExif(photo: PublicPhoto): MetaItem[] {
  const text = publicationCopy[photo.language].photos;
  const entries: Array<[string, string | null]> = [
    [text.camera, photo.exif.camera],
    [text.lens, photo.exif.lens],
    [text.focalLength, photo.exif.focalLength],
    [text.aperture, photo.exif.aperture],
    [text.shutterSpeed, photo.exif.shutterSpeed],
    [text.iso, photo.exif.iso],
  ];

  return entries.flatMap(([label, value]) =>
    value === null ? [] : [{ label, value, data: true }],
  );
}
