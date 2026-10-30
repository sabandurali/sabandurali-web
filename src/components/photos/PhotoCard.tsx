import { cardGrids, type CardGridColumns } from "@/components/pages/card-grid";
import { PublicationImage } from "@/components/pages/publication-media";
import Card from "@/components/ui/Card";
import { getPhotoCredit } from "@/components/photos/photo-details";
import { Credit } from "@/components/ui/Figure";
import { getPhotoPath } from "@/content/photos/photo-routes";
import type { PublicPhoto } from "@/content/photos/types";

type PhotoCardProps = {
  photo: PublicPhoto;
  headingLevel?: "h2" | "h3";
  /** Columns of the grid the card sits in, for the image `sizes`. */
  columns?: CardGridColumns;
};

/**
 * One photograph in a list: the image with its credit, collections, title
 * link and location. The title is the only link and the card's name.
 */
export default function PhotoCard({
  photo,
  headingLevel = "h2",
  columns = 3,
}: PhotoCardProps) {
  const collections = photo.collections.map((item) => item.title).join(" · ");

  return (
    <Card
      title={photo.title}
      href={getPhotoPath(photo.slug, photo.language)}
      headingLevel={headingLevel === "h2" ? 2 : 3}
      media={
        <PublicationImage
          src={photo.image.src}
          alt={photo.image.alt}
          layout="fill"
          sizes={cardGrids[columns].sizes}
        />
      }
      credit={<Credit credit={getPhotoCredit(photo)} locale={photo.language} />}
      eyebrow={
        collections === "" ? undefined : (
          <span className="font-semibold text-ink">{collections}</span>
        )
      }
    >
      {photo.locationName !== null ? (
        <p className="m-0 type-small text-ink-muted">{photo.locationName}</p>
      ) : null}
    </Card>
  );
}
