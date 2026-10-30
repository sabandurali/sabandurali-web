import type { DistrictSide } from "@/content/districts/district-registry";

export type DirectoryEntry = {
  name: string;
  slug: string;
  side: DistrictSide;
  /** Grid reference on the schematic map, e.g. "F2". */
  ref: string;
  /** Public summary of a published guide; null without one. */
  summary: string | null;
};

export type DirectoryFilter = {
  query: string;
  side: "all" | DistrictSide;
  /** First letter, or "" for every letter. */
  letter: string;
};

/**
 * Search form of a name: Turkish lower case, dotless ı folded to i and
 * diacritics removed, so "sisli", "Şişli" and "ŞİŞLİ" all match Şişli.
 */
export function foldSearchText(value: string): string {
  return value
    .normalize("NFC")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const collator = new Intl.Collator("tr", { sensitivity: "base" });

/** Entries in Turkish alphabetical order (Ç after C, Ş after S). */
export function sortDirectoryEntries<T extends { name: string }>(
  entries: readonly T[],
): T[] {
  return [...entries].sort((a, b) => collator.compare(a.name, b.name));
}

/** Distinct first letters of the names, in alphabetical order. */
export function directoryLetters(
  entries: readonly { name: string }[],
): string[] {
  const letters: string[] = [];
  for (const entry of sortDirectoryEntries(entries)) {
    const letter = Array.from(entry.name)[0];
    if (letter && !letters.includes(letter)) letters.push(letter);
  }
  return letters;
}

export function filterDirectoryEntries<
  T extends Pick<DirectoryEntry, "name" | "side">,
>(entries: readonly T[], filter: DirectoryFilter): T[] {
  const query = foldSearchText(filter.query.trim());
  return sortDirectoryEntries(entries).filter(
    (entry) =>
      (filter.side === "all" || entry.side === filter.side) &&
      (!filter.letter || entry.name.startsWith(filter.letter)) &&
      foldSearchText(entry.name).includes(query),
  );
}

export function isDirectorySide(
  value: string,
): value is DirectoryFilter["side"] {
  return value === "all" || value === "avrupa" || value === "anadolu";
}
