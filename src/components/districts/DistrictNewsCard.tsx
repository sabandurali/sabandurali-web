import Image from "next/image";
import type { PublicArticleSummary } from "@/content/articles/public-types";

function formatDate(value: string) { return new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(new Date(value)); }

export default function DistrictNewsCard({ news }: { news: PublicArticleSummary }) {
  const source = news.externalSource;
  if (source === null) return null;
  return <article className="overflow-hidden border border-border bg-surface">
    {news.featuredImage !== null && <Image src={news.featuredImage.src} alt={news.featuredImage.alt} width={news.featuredImage.width ?? 960} height={news.featuredImage.height ?? 540} className="aspect-video w-full object-cover" />}
    <div className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-soft">{news.newsCategory?.replaceAll("-", " ") ?? "Yerel gelişme"}</p>
      <h3 className="mt-3 text-2xl leading-tight text-ivory">{news.title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted">{news.summary}</p>
      <p className="mt-4 text-xs text-muted">{formatDate(news.publishedAt)} · {source.name}</p>
      <a href={source.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-accent-soft underline underline-offset-4 hover:text-ivory">Kaynağa git <span aria-hidden="true">↗</span></a>
    </div>
  </article>;
}
