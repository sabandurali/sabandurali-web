"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import { cx } from "@/components/ui/cx";
import DistrictKeyMap from "@/components/ui/DistrictKeyMap";
import EmptyState from "@/components/ui/EmptyState";
import { Field, Input } from "@/components/ui/Field";
import GridRef from "@/components/ui/GridRef";
import { getDistrictPath } from "@/content/districts/district-routes";
import {
  directoryLetters,
  filterDirectoryEntries,
  isDirectorySide,
  type DirectoryEntry,
  type DirectoryFilter,
} from "./district-directory-filter";

const selectClassName =
  "block min-h-12 w-full rounded-control border border-tile-edge bg-land px-3.5 py-2.5 text-base text-ink hover:border-ink focus-visible:border-ink";

/**
 * Searchable list of the 39 district guides: name search, side select and
 * letter buttons filter the cards on the client; without JavaScript every
 * card is listed. Each card is one link named by the district.
 */
export default function DistrictDirectory({
  entries,
}: {
  entries: readonly DirectoryEntry[];
}) {
  const [filter, setFilter] = useState<DirectoryFilter>({
    query: "",
    side: "all",
    letter: "",
  });
  const letters = directoryLetters(entries);
  const visible = filterDirectoryEntries(entries, filter);

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:items-end">
        <Field
          label="İlçe ara"
          hint="Türkçe karakter olmadan da yazabilirsiniz."
        >
          {(control) => (
            <Input
              {...control}
              type="search"
              autoComplete="off"
              value={filter.query}
              onChange={(event) =>
                setFilter((current) => ({
                  ...current,
                  query: event.target.value,
                }))
              }
              placeholder="Örneğin: Kadıköy"
            />
          )}
        </Field>
        <Field label="Yaka" id="district-side">
          {(control) => (
            <select
              {...control}
              value={filter.side}
              onChange={(event) => {
                const side = event.target.value;
                if (isDirectorySide(side)) {
                  setFilter((current) => ({ ...current, side }));
                }
              }}
              className={selectClassName}
            >
              <option value="all">Tüm ilçeler</option>
              <option value="avrupa">Avrupa Yakası</option>
              <option value="anadolu">Anadolu Yakası</option>
            </select>
          )}
        </Field>
      </div>

      <div
        role="group"
        aria-label="Baş harfe göre"
        className="flex flex-wrap gap-1.5"
      >
        {["", ...letters].map((value) => {
          const pressed = filter.letter === value;
          return (
            <button
              key={value || "all"}
              type="button"
              aria-pressed={pressed}
              onClick={() =>
                setFilter((current) => ({ ...current, letter: value }))
              }
              className={cx(
                "inline-flex min-h-tap min-w-tap items-center justify-center rounded-control px-3 font-mono text-small font-semibold [font-stretch:var(--stretch-mono)]",
                pressed
                  ? "bg-sea text-on-sea"
                  : "border border-tile-edge bg-land text-ink hover:border-ink hover:underline",
              )}
            >
              {value || "Tümü"}
            </button>
          );
        })}
      </div>

      <p role="status" className="m-0 type-small text-ink-muted">
        {visible.length} ilçe gösteriliyor
      </p>

      {visible.length === 0 ? (
        <EmptyState>Bu aramaya uygun ilçe bulunamadı.</EmptyState>
      ) : (
        <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((entry) => (
            <li
              key={entry.slug}
              data-district-card={entry.slug}
              className="flex"
            >
              <Card
                title={entry.name}
                href={getDistrictPath(entry.slug)}
                prefetch={false}
                className="w-full"
                eyebrow={
                  <>
                    <GridRef value={entry.ref} />
                    <span>
                      {entry.side === "avrupa"
                        ? "Avrupa Yakası"
                        : "Anadolu Yakası"}
                    </span>
                  </>
                }
                cta="Rehberi aç"
              >
                {/* Decorative locator; phones skip it to keep 39 cards short. */}
                <div className="hidden sm:block">
                  <DistrictKeyMap
                    featuredSlug={entry.slug}
                    className="max-w-[12rem]"
                  />
                </div>
                <p className="m-0 line-clamp-4 type-small text-ink-muted">
                  {entry.summary ??
                    "Bu ilçe için doğrulanmış rehber içeriği henüz yayımlanmadı."}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
