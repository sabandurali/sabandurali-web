import { cardGrids, type CardGridColumns } from "@/components/pages/card-grid";
import { PublicationImage } from "@/components/pages/publication-media";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { photoCopy } from "@/components/photos/photo-copy";
import { getPhotoCredit } from "@/components/photos/photo-details";
import { Credit } from "@/components/ui/Figure";
import { getPhotoPath } from "@/content/photos/photo-routes";
import type { SiteLocale } from "@/content/locales";
import type { PublicPhoto } from "@/content/photos/types";

type PhotoCardProps = {
  photo: PublicPhoto;
  headingLevel?: "h2" | "h3";
  /** Columns of the grid the card sits in, for the image `sizes`. */
  columns?: CardGridColumns;
  /**
   * Language of the page the card is on. A photograph in another language
   * (a Turkish photo on the English list) gets an "In Turkish" badge and its
   * link names the target language; the list marks the card itself with
   * `lang` (WCAG 3.1.2).
   */
  pageLanguage?: SiteLocale;
};

/**
 * One photograph in a list: the image with its credit, collections, title
 * link and location. The title is the only link and the card's name.
 */
export default function PhotoCard({
  photo,
  headingLevel = "h2",
  columns = 3,
  pageLanguage = photo.language,
}: PhotoCardProps) {
  const collections = photo.collections.map((item) => item.title).join(" · ");
  const foreign = photo.language !== pageLanguage;
  const languageBadge = foreign ? (
    <Badge tone="neutral" className="border border-ink">
      <span lang={pageLanguage}>
        {photoCopy[pageLanguage].inLanguage[photo.language]}
      </span>
    </Badge>
  ) : null;

  return (
    <Card
      title={photo.title}
      href={getPhotoPath(photo.slug, photo.language)}
      headingLevel={headingLevel === "h2" ? 2 : 3}
      hrefLang={foreign ? photo.language : undefined}
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
        collections === "" && languageBadge === null ? undefined : (
          <>
            {languageBadge}
            {collections === "" ? null : (
              <span className="font-semibold text-ink">{collections}</span>
            )}
          </>
        )
      }
    >
      {photo.locationName !== null ? (
        <p className="m-0 type-small text-ink-muted">{photo.locationName}</p>
      ) : null}
    </Card>
  );
}
