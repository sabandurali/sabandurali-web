import PublicationShell from "@/components/pages/PublicationShell";
import { getSameDistrictPhotos } from "@/content/photos/photo-data-source";
import { getPhotoLanguagePaths } from "@/content/photos/photo-routes";
import PhotoDetailContent, {
  type PhotoDetailProps,
} from "./PhotoDetailContent";

/**
 * Photograph page: the site shell around PhotoDetailContent, with the other
 * photographs of the photo's district (none when it has no district).
 */
export default async function PhotoDetailPage(
  props: Omit<PhotoDetailProps, "sameDistrict">,
) {
  const sameDistrict = await getSameDistrictPhotos(props.photo, props.related);

  return (
    <PublicationShell
      locale={props.photo.language}
      languageHrefs={getPhotoLanguagePaths(props.photo, props.translation)}
    >
      <PhotoDetailContent {...props} sameDistrict={sameDistrict} />
    </PublicationShell>
  );
}
