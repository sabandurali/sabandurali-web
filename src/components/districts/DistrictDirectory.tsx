"use client";
import { useState } from "react";
import Link from "next/link";
import { getDistrictPath } from "@/content/districts/district-routes";
import type { District } from "@/content/districts/district-registry";
export default function DistrictDirectory({
  entries,
}: {
  entries: Array<
    Pick<District, "name" | "slug" | "side"> & { summary: string | null }
  >;
}) {
  const [query, setQuery] = useState("");
  const [side, setSide] = useState("all");
  const [letter, setLetter] = useState("");
  const normalize = (value: string) =>
    value
      .normalize("NFC")
      .toLocaleLowerCase("tr-TR")
      .replace(/ı/g, "i")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const sorted = [...entries].sort((a, b) =>
    a.name.localeCompare(b.name, "tr"),
  );
  const letters = [...new Set(sorted.map((item) => item.name[0]))];
  const visible = sorted.filter(
    (item) =>
      (side === "all" || item.side === side) &&
      (!letter || item.name.startsWith(letter)) &&
      normalize(item.name).includes(normalize(query.trim())),
  );
  return (
    <section className="py-9 sm:py-10" aria-label="İlçe seçimi">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-ivory">
          İlçe ara
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Örneğin: Kadıköy"
            className="mt-2 block min-h-12 w-full border border-border bg-surface px-4 text-ivory"
          />
        </label>
        <div className="text-sm text-ivory">
          <label htmlFor="district-side">Yaka</label>
          <select
            id="district-side"
            value={side}
            onChange={(event) => setSide(event.target.value)}
            className="mt-2 block min-h-12 w-full border border-border bg-surface px-4 text-ivory"
          >
            <option value="all">Tüm ilçeler</option>
            <option value="avrupa">Avrupa Yakası</option>
            <option value="anadolu">Anadolu Yakası</option>
          </select>
        </div>
      </div>
      <div aria-label="Alfabetik erişim" className="mt-5 flex flex-wrap gap-2">
        {["", ...letters].map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={letter === value}
            onClick={() => setLetter(value)}
            className={`min-h-11 min-w-11 border px-3 text-sm ${letter === value ? "border-accent bg-surface text-ivory" : "border-border text-muted"}`}
          >
            {value || "Tümü"}
          </button>
        ))}
      </div>
      <p role="status" className="my-5 text-sm text-muted">
        {visible.length} ilçe gösteriliyor
      </p>
      {!visible.length && (
        <p className="border border-border p-5 text-muted">
          Bu aramaya uygun ilçe bulunamadı.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((district) => (
          <Link
            data-district-card={district.slug}
            key={district.slug}
            href={getDistrictPath(district.slug)}
            className="group border border-border bg-[#17364D] p-4 transition-colors hover:border-[var(--accent-border-hover)] hover:bg-[#20445C] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus-ring)] sm:p-5"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-accent-strong">
              {district.side === "avrupa" ? "Avrupa" : "Anadolu"} Yakası
            </p>
            <h2 className="mt-2 text-2xl leading-tight text-ivory">
              {district.name}
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              {district.summary ||
                `${district.name} için tarih, yaşam, ulaşım ve şehir araştırmaları.`}
            </p>
            <span className="mt-4 inline-block text-sm text-muted underline decoration-border underline-offset-4 group-hover:text-accent-strong">
              Rehberi aç →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
