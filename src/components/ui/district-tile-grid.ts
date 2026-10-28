import {
  districts,
  type DistrictSide,
} from "@/content/districts/district-registry";

/*
 * Grid positions of the schematic district tile map ("şematik, ölçeksiz").
 *
 * Taken from the approved İstanbul Atlası prototype: the 39 districts sit
 * in a 14 × 5 square grid split by the Bosphorus band, 25 Avrupa Yakası
 * squares west of it and 14 Anadolu Yakası squares east of it. The squares
 * show an approximate arrangement, never borders, areas or distances.
 * The seven districts the Esenler guide names as neighbours all touch F2.
 *
 * Column letters skip I and O (they read like İ/ı and 0) and the Bosphorus
 * band has no letter, so K never appears in a grid reference.
 */
export const westColumns = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "J",
] as const;
export const eastColumns = ["L", "M", "N", "P", "R"] as const;
export const tileRows = [1, 2, 3, 4, 5] as const;

export type TileColumn =
  (typeof westColumns)[number] | (typeof eastColumns)[number];
export type TileRow = (typeof tileRows)[number];

export type DistrictTilePosition = {
  slug: string;
  col: TileColumn;
  row: TileRow;
  /** Name with "|" at the places a narrow tile may hyphenate. */
  breaks: string;
};

export const districtTilePositions: readonly DistrictTilePosition[] = [
  // Row 1
  { slug: "arnavutkoy", col: "D", row: 1, breaks: "Arnavut|köy" },
  { slug: "basaksehir", col: "E", row: 1, breaks: "Başak|şehir" },
  { slug: "sultangazi", col: "F", row: 1, breaks: "Sultan|gazi" },
  { slug: "gaziosmanpasa", col: "G", row: 1, breaks: "Gazi|osman|paşa" },
  { slug: "eyupsultan", col: "H", row: 1, breaks: "Eyüp|sultan" },
  { slug: "sariyer", col: "J", row: 1, breaks: "Sarıyer" },
  { slug: "beykoz", col: "L", row: 1, breaks: "Beykoz" },
  { slug: "sile", col: "P", row: 1, breaks: "Şile" },
  // Row 2
  { slug: "catalca", col: "B", row: 2, breaks: "Çatalca" },
  { slug: "esenyurt", col: "C", row: 2, breaks: "Esen|yurt" },
  { slug: "kucukcekmece", col: "D", row: 2, breaks: "Küçük|çek|mece" },
  { slug: "bagcilar", col: "E", row: 2, breaks: "Bağcılar" },
  { slug: "esenler", col: "F", row: 2, breaks: "Esenler" },
  { slug: "bayrampasa", col: "G", row: 2, breaks: "Bayram|paşa" },
  { slug: "kagithane", col: "H", row: 2, breaks: "Kağıt|hane" },
  { slug: "besiktas", col: "J", row: 2, breaks: "Beşiktaş" },
  { slug: "uskudar", col: "L", row: 2, breaks: "Üsküdar" },
  { slug: "umraniye", col: "M", row: 2, breaks: "Ümraniye" },
  { slug: "cekmekoy", col: "N", row: 2, breaks: "Çekme|köy" },
  // Row 3
  { slug: "silivri", col: "A", row: 3, breaks: "Silivri" },
  { slug: "buyukcekmece", col: "B", row: 3, breaks: "Büyük|çek|mece" },
  { slug: "beylikduzu", col: "C", row: 3, breaks: "Beylik|düzü" },
  { slug: "avcilar", col: "D", row: 3, breaks: "Avcılar" },
  { slug: "bahcelievler", col: "E", row: 3, breaks: "Bahçeli|evler" },
  { slug: "gungoren", col: "F", row: 3, breaks: "Güngören" },
  { slug: "zeytinburnu", col: "G", row: 3, breaks: "Zeytin|burnu" },
  { slug: "sisli", col: "H", row: 3, breaks: "Şişli" },
  { slug: "beyoglu", col: "J", row: 3, breaks: "Beyoğlu" },
  { slug: "kadikoy", col: "L", row: 3, breaks: "Kadıköy" },
  { slug: "atasehir", col: "M", row: 3, breaks: "Ata|şehir" },
  { slug: "sancaktepe", col: "N", row: 3, breaks: "Sancak|tepe" },
  { slug: "sultanbeyli", col: "P", row: 3, breaks: "Sultan|beyli" },
  // Row 4
  { slug: "bakirkoy", col: "F", row: 4, breaks: "Bakırköy" },
  { slug: "fatih", col: "J", row: 4, breaks: "Fatih" },
  { slug: "maltepe", col: "M", row: 4, breaks: "Maltepe" },
  { slug: "kartal", col: "N", row: 4, breaks: "Kartal" },
  { slug: "pendik", col: "P", row: 4, breaks: "Pendik" },
  { slug: "tuzla", col: "R", row: 4, breaks: "Tuzla" },
  // Row 5
  { slug: "adalar", col: "M", row: 5, breaks: "Adalar" },
];

/** CSS grid line layout: 1 = row ruler, 2–10 = A–J, 11 = band, 12–16 = L–R. */
export const bosphorusGridColumn = westColumns.length + 2;
export const tileGridColumnCount = westColumns.length + eastColumns.length + 2;

export function isWestColumn(col: TileColumn): boolean {
  return (westColumns as readonly string[]).includes(col);
}

export function sideOfColumn(col: TileColumn): DistrictSide {
  return isWestColumn(col) ? "avrupa" : "anadolu";
}

export function tileGridColumn(col: TileColumn): number {
  const west = westColumns.findIndex((letter) => letter === col);
  if (west >= 0) return west + 2;
  const east = eastColumns.findIndex((letter) => letter === col);
  return bosphorusGridColumn + 1 + east;
}

/** CSS grid row line: row 1 holds the column ruler. */
export function tileGridRow(row: TileRow): number {
  return row + 1;
}

export function formatTileRef(col: TileColumn, row: TileRow): string {
  return `${col}${row}`;
}

/** Visible label with soft hyphens (U+00AD) at the allowed break points. */
export function tileLabel(breaks: string): string {
  return breaks.split("|").join("\u00ad");
}

export type DistrictTile = DistrictTilePosition & {
  name: string;
  side: DistrictSide;
  /** Grid reference, e.g. "F2". */
  ref: string;
  /** Name with soft hyphens. */
  label: string;
};

/** Registry districts joined with their tile, in grid (reading) order. */
export function getDistrictTiles(): DistrictTile[] {
  return districtTilePositions.map((position) => {
    const district = districts.find((entry) => entry.slug === position.slug);
    if (!district) {
      throw new Error(`Unknown district on the tile map: ${position.slug}`);
    }
    return {
      ...position,
      name: district.name,
      side: district.side,
      ref: formatTileRef(position.col, position.row),
      label: tileLabel(position.breaks),
    };
  });
}

/** District name with soft hyphens (for PlateTitle and narrow tiles). */
export function getDistrictLabel(slug: string): string | null {
  const position = districtTilePositions.find((tile) => tile.slug === slug);
  return position ? tileLabel(position.breaks) : null;
}

/** Alphabetical in Turkish collation (Ç after C, İ after I, Ş after S). */
export function sortTilesByName(
  tiles: readonly DistrictTile[],
): DistrictTile[] {
  const collator = new Intl.Collator("tr", { sensitivity: "base" });
  return [...tiles].sort((a, b) => collator.compare(a.name, b.name));
}
