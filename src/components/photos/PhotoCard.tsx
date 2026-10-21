import Image from "next/image";
import Link from "next/link";
import { getPhotoPath } from "@/content/photos/photo-routes";
import type { PublicPhoto } from "@/content/photos/types";

type PhotoCardProps = {
  photo: PublicPhoto;
  headingLevel?: "h2" | "h3";
  compact?: boolean;
};

export default function PhotoCard({
  photo,
  headingLevel = "h2",
  compact = false,
}: PhotoCardProps) {
  const Heading = headingLevel;

  return (
    <article className="group overflow-hidden border border-[var(--accent-border-soft)] bg-surface transition-colors hover:border-[var(--accent-border-hover)] motion-reduce:transition-none">
      <Link
        href={getPhotoPath(photo.slug, photo.language)}
        className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <span className={`relative block overflow-hidden bg-background ${compact ? "aspect-[4/5]" : "aspect-[4/3]"}`}>
          {photo.image.width !== undefined && photo.image.height !== undefined ? (
            <Image
              src={photo.image.src}
              alt={photo.image.alt}
              width={photo.image.width}
              height={photo.image.height}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
            />
          ) : (
            <Image
              src={photo.image.src}
              alt={photo.image.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
            />
          )}
        </span>
        <div className={compact ? "p-3.5" : "p-5"}>
          <p className={`${compact ? "text-[8px]" : "text-xs"} font-semibold uppercase tracking-[0.16em] text-accent-soft`}>
            {photo.collections.map((item) => item.title).join(" · ")}
          </p>
          <Heading className={compact ? "mt-2 line-clamp-2 font-serif text-base text-ivory" : "mt-3 text-2xl text-ivory"}>{photo.title}</Heading>
          {photo.locationName !== null && (
            <p className={compact ? "mt-2 line-clamp-1 text-[9px] text-muted" : "mt-2 text-sm text-muted"}>{photo.locationName}</p>
          )}
        </div>
      </Link>
    </article>
  );
}
