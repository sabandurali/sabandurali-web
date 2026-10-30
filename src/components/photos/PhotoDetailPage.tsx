import PublicationShell from "@/components/pages/PublicationShell";
import { getPhotoLanguagePaths } from "@/content/photos/photo-routes";
import PhotoDetailContent, {
  type PhotoDetailProps,
} from "./PhotoDetailContent";

/** Photograph page: the site shell around PhotoDetailContent. */
export default function PhotoDetailPage(props: PhotoDetailProps) {
  return (
    <PublicationShell
      locale={props.photo.language}
      languageHrefs={getPhotoLanguagePaths(props.photo, props.translation)}
    >
      <PhotoDetailContent {...props} />
    </PublicationShell>
  );
}
