import Image from "next/image";
import Link from "next/link";
import { getPhotoPath } from "@/content/photos/photo-routes";
import type { PublicPhoto } from "@/content/photos/types";

export default function PhotoCard({ photo }: { photo: PublicPhoto }) {
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-surface shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
      <Link
        href={getPhotoPath(photo.slug, photo.language)}
        className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <span className="relative block aspect-[4/3] overflow-hidden bg-background">
          {photo.image.width !== undefined && photo.image.height !== undefined ? (
            <Image
              src={photo.image.src}
              alt={photo.image.alt}
              width={photo.image.width}
              height={photo.image.height}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <Image
              src={photo.image.src}
              alt={photo.image.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          )}
        </span>
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-soft">
            {photo.collections.map((item) => item.title).join(" · ")}
          </p>
          <h2 className="mt-3 text-2xl text-ivory">{photo.title}</h2>
          {photo.locationName !== null && (
            <p className="mt-2 text-sm text-muted">{photo.locationName}</p>
          )}
        </div>
      </Link>
    </article>
  );
}
