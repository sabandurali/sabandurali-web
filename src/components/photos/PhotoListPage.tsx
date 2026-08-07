import Link from "next/link";
import PhotoCard from "@/components/photos/PhotoCard";
import BackToTop from "@/components/layout/BackToTop";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { homeContent } from "@/content/homeContent";
import { photoListPaths } from "@/content/photos/photo-routes";
import type {
  PhotoLanguage,
  PhotoListFilters,
  PublishedPhotoList,
} from "@/content/photos/types";

function pageHref(locale: PhotoLanguage, filters: PhotoListFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.collection) params.set("collection", filters.collection);
  if (filters.tag) params.set("tag", filters.tag);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `${photoListPaths[locale]}${query ? `?${query}` : ""}`;
}

export default function PhotoListPage({
  locale,
  filters,
  result,
}: {
  locale: PhotoLanguage;
  filters: PhotoListFilters;
  result: PublishedPhotoList;
}) {
  const home = homeContent[locale];
  const homePath = locale === "tr" ? "/" : "/en";
  const copy = locale === "tr"
    ? {
        eyebrow: "FOTOĞRAFÇILIK",
        title: "Fotoğraf Hikâyeleri",
        description: "Şehir, insan ve hayvan hikâyelerinden seçilmiş fotoğraflar.",
        collection: "Koleksiyon",
        tag: "Etiket",
        all: "Tümü",
        filter: "Filtrele",
        empty: "Bu filtrelerle eşleşen yayımlanmış fotoğraf bulunmuyor.",
        previous: "Önceki",
        next: "Sonraki",
      }
    : {
        eyebrow: "PHOTOGRAPHY",
        title: "Photo Stories",
        description: "Selected photographs from city, human and animal stories.",
        collection: "Collection",
        tag: "Tag",
        all: "All",
        filter: "Filter",
        empty: "No published photographs match these filters.",
        previous: "Previous",
        next: "Next",
      };

  return (
    <div id="top" lang={locale}>
      <Header locale={locale} anchors={home.anchors} content={home.header} homeHref={homePath} anchorPrefix={homePath} languageHrefs={photoListPaths} />
      <main className="px-4 py-14 sm:px-6 sm:py-18 lg:py-22">
        <div className="mx-auto max-w-7xl">
          <header className="border-b border-border pb-8 sm:pb-10">
            <p className="text-xs font-semibold tracking-[0.22em] text-accent-soft">{copy.eyebrow}</p>
            <h1 className="mt-4 text-4xl text-ivory sm:text-5xl">{copy.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">{copy.description}</p>
          </header>
          <form className="mt-8 grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-[1fr_1fr_auto]" action={photoListPaths[locale]}>
            <label className="grid gap-2 text-sm font-semibold text-ivory">
              {copy.collection}
              <select name="collection" defaultValue={filters.collection ?? ""} className="min-h-11 rounded-md border border-border bg-background px-3 text-base font-normal text-ivory">
                <option value="">{copy.all}</option>
                {result.collections.map((item) => <option key={item.id} value={item.slug}>{item.title}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ivory">
              {copy.tag}
              <select name="tag" defaultValue={filters.tag ?? ""} className="min-h-11 rounded-md border border-border bg-background px-3 text-base font-normal text-ivory">
                <option value="">{copy.all}</option>
                {result.tags.map((item) => <option key={item.id} value={item.slug}>{item.title}</option>)}
              </select>
            </label>
            <button type="submit" className="min-h-11 self-end rounded-md bg-accent px-5 text-sm font-semibold text-ink hover:bg-accent-strong">{copy.filter}</button>
          </form>
          {result.photos.length === 0 ? (
            <p className="mt-8 rounded-xl border border-border bg-surface p-6 text-muted">{copy.empty}</p>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.photos.map((photo) => <PhotoCard key={photo.id} photo={photo} />)}
            </div>
          )}
          {result.totalPages > 1 && (
            <nav aria-label={locale === "tr" ? "Fotoğraf sayfaları" : "Photography pages"} className="mt-10 flex items-center justify-between gap-4">
              {result.page > 1 ? <Link href={pageHref(locale, filters, result.page - 1)} className="min-h-11 rounded-md border border-border px-4 py-3 text-sm text-ivory">← {copy.previous}</Link> : <span />}
              <span className="text-sm text-muted">{result.page} / {result.totalPages}</span>
              {result.page < result.totalPages ? <Link href={pageHref(locale, filters, result.page + 1)} className="min-h-11 rounded-md border border-border px-4 py-3 text-sm text-ivory">{copy.next} →</Link> : <span />}
            </nav>
          )}
        </div>
      </main>
      <Footer id={home.anchors.contact} content={home.footer} />
      <BackToTop label={home.backToTopLabel} />
    </div>
  );
}
