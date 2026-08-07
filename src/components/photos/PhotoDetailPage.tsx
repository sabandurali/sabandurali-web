import Image from "next/image";
import Link from "next/link";
import PhotoCard from "@/components/photos/PhotoCard";
import BackToTop from "@/components/layout/BackToTop";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { homeContent } from "@/content/homeContent";
import {
  getPhotoLanguagePaths,
  photoListPaths,
} from "@/content/photos/photo-routes";
import type {
  PublicPhoto,
  PublicPhotoTranslation,
} from "@/content/photos/types";

function formatDate(value: string | null, locale: "tr" | "en") {
  if (value === null || !Number.isFinite(Date.parse(value))) return null;
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function PhotoDetailPage({
  photo,
  translation,
  related,
}: {
  photo: PublicPhoto;
  translation: PublicPhotoTranslation | null;
  related: PublicPhoto[];
}) {
  const locale = photo.language;
  const home = homeContent[locale];
  const homePath = locale === "tr" ? "/" : "/en";
  const takenAt = formatDate(photo.takenAt, locale);
  const exif = [
    [locale === "tr" ? "Kamera" : "Camera", photo.exif.camera],
    [locale === "tr" ? "Lens" : "Lens", photo.exif.lens],
    [locale === "tr" ? "Odak uzaklığı" : "Focal length", photo.exif.focalLength],
    [locale === "tr" ? "Diyafram" : "Aperture", photo.exif.aperture],
    [locale === "tr" ? "Enstantane" : "Shutter speed", photo.exif.shutterSpeed],
    [locale === "tr" ? "ISO" : "ISO", photo.exif.iso],
  ].filter((item): item is [string, string] => item[1] !== null);
  const labels = locale === "tr"
    ? { back: "Fotoğraflara dön", location: "Konum", date: "Tarih", photographer: "Fotoğrafçı", credit: "Kredi / lisans", exif: "EXIF", related: "İlgili fotoğraflar", translation: "English" }
    : { back: "Back to photography", location: "Location", date: "Date", photographer: "Photographer", credit: "Credit / license", exif: "EXIF", related: "Related photographs", translation: "Türkçe" };

  return (
    <div id="top" lang={locale}>
      <Header locale={locale} anchors={home.anchors} content={home.header} homeHref={homePath} anchorPrefix={homePath} languageHrefs={getPhotoLanguagePaths(photo, translation)} />
      <main className="px-4 py-10 sm:px-6 sm:py-14 lg:py-18">
        <article className="mx-auto max-w-6xl">
          <nav aria-label={labels.back} className="mb-8">
            <Link href={photoListPaths[locale]} className="inline-flex min-h-11 items-center text-sm text-accent-soft underline decoration-border underline-offset-4 hover:text-accent-strong">← {labels.back}</Link>
          </nav>
          <header className="border-b border-border pb-9 sm:pb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-soft">{photo.collections.map((item) => item.title).join(" · ")}</p>
            <h1 className="mt-4 text-4xl leading-[1.08] text-ivory sm:text-5xl lg:text-6xl">{photo.title}</h1>
            {photo.description !== null && <p className="mt-6 max-w-3xl text-lg leading-8 text-muted sm:text-xl">{photo.description}</p>}
            {translation !== null && <Link href={getPhotoLanguagePaths(photo, translation)[translation.language]} className="mt-7 inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold text-accent-strong hover:border-accent hover:text-ivory">{labels.translation} →</Link>}
          </header>
          <figure className="mt-10 sm:mt-12">
            {photo.image.width !== undefined && photo.image.height !== undefined ? (
              <Image src={photo.image.src} alt={photo.image.alt} width={photo.image.width} height={photo.image.height} sizes="(min-width: 1280px) 1152px, 100vw" priority className="h-auto w-full rounded-xl border border-border object-contain" />
            ) : (
              <span className="relative block aspect-[4/3] overflow-hidden rounded-xl border border-border"><Image src={photo.image.src} alt={photo.image.alt} fill sizes="(min-width: 1280px) 1152px, 100vw" priority className="object-contain" /></span>
            )}
            <figcaption className="mt-3 text-sm text-muted">{photo.image.alt}</figcaption>
          </figure>
          <dl className="mt-10 grid gap-5 border-y border-border py-8 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {photo.locationName !== null && <div><dt className="font-semibold text-ivory">{labels.location}</dt><dd className="mt-1 text-muted">{photo.locationName}</dd></div>}
            {takenAt !== null && <div><dt className="font-semibold text-ivory">{labels.date}</dt><dd className="mt-1 text-muted">{takenAt}</dd></div>}
            <div><dt className="font-semibold text-ivory">{labels.photographer}</dt><dd className="mt-1 text-muted">{photo.photographer}</dd></div>
            {photo.creditLicense !== null && <div><dt className="font-semibold text-ivory">{labels.credit}</dt><dd className="mt-1 text-muted">{photo.creditLicense}</dd></div>}
          </dl>
          {photo.tags.length > 0 && <p className="mt-6 text-sm text-muted">{photo.tags.map((item) => `#${item.title}`).join(" ")}</p>}
          {exif.length > 0 && <section className="mt-12" aria-labelledby="photo-exif"><h2 id="photo-exif" className="text-2xl text-ivory">{labels.exif}</h2><dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{exif.map(([label, value]) => <div key={label} className="rounded-lg border border-border bg-surface p-4"><dt className="text-sm font-semibold text-ivory">{label}</dt><dd className="mt-1 text-sm text-muted">{value}</dd></div>)}</dl></section>}
          {related.length > 0 && <section className="mt-14 border-t border-border pt-10" aria-labelledby="related-photos"><h2 id="related-photos" className="text-3xl text-ivory">{labels.related}</h2><div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{related.map((item) => <PhotoCard key={item.id} photo={item} />)}</div></section>}
        </article>
      </main>
      <Footer id={home.anchors.contact} content={home.footer} />
      <BackToTop label={home.backToTopLabel} />
    </div>
  );
}
