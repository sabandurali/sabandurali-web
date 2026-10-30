import assert from "node:assert/strict";
import test from "node:test";
import { districts } from "../../content/districts/district-registry";
import {
  bosphorusGridColumn,
  districtTilePositions,
  eastColumns,
  formatTileRef,
  getDistrictLabel,
  getDistrictTiles,
  sideOfColumn,
  sortTilesByName,
  tileGridColumn,
  tileGridColumnCount,
  tileGridRow,
  tileLabel,
  tileRows,
  westColumns,
} from "./district-tile-grid";

test("the tile map places each of the 39 registry districts exactly once", () => {
  const slugs = districtTilePositions.map((tile) => tile.slug);
  assert.equal(slugs.length, 39);
  assert.equal(new Set(slugs).size, 39);
  assert.deepEqual(
    [...slugs].sort(),
    districts.map((district) => district.slug).sort(),
  );
});

test("the Bosphorus band splits the map into 25 Avrupa and 14 Anadolu tiles", () => {
  const tiles = getDistrictTiles();
  for (const tile of tiles) {
    assert.equal(
      sideOfColumn(tile.col),
      tile.side,
      `${tile.name} (${tile.ref}) is on the wrong side of the Bosphorus band`,
    );
    const column = tileGridColumn(tile.col);
    if (tile.side === "avrupa") assert.ok(column < bosphorusGridColumn);
    else assert.ok(column > bosphorusGridColumn);
  }
  assert.equal(tiles.filter((tile) => tile.side === "avrupa").length, 25);
  assert.equal(tiles.filter((tile) => tile.side === "anadolu").length, 14);
});

test("no two districts share a square and every square is on the grid", () => {
  const cells = districtTilePositions.map((tile) => `${tile.col}${tile.row}`);
  assert.equal(new Set(cells).size, cells.length);
  const columns: readonly string[] = [...westColumns, ...eastColumns];
  for (const tile of districtTilePositions) {
    assert.ok(columns.includes(tile.col), `${tile.slug}: column ${tile.col}`);
    assert.ok(
      (tileRows as readonly number[]).includes(tile.row),
      `${tile.slug}: row ${tile.row}`,
    );
  }
});

test("grid letters never use I, O or K (İ/ı, 0, source codes, north)", () => {
  const columns: readonly string[] = [...westColumns, ...eastColumns];
  for (const letter of ["I", "O", "K"]) {
    assert.equal(columns.includes(letter), false, letter);
  }
  assert.equal(new Set(columns).size, columns.length);
});

test("grid lines: ruler, nine western columns, band, five eastern columns", () => {
  assert.equal(tileGridColumn("A"), 2);
  assert.equal(tileGridColumn("J"), 10);
  assert.equal(bosphorusGridColumn, 11);
  assert.equal(tileGridColumn("L"), 12);
  assert.equal(tileGridColumn("R"), 16);
  assert.equal(tileGridColumnCount, 16);
  assert.equal(tileGridRow(1), 2);
  assert.equal(tileGridRow(5), 6);
});

test("references match the approved prototype", () => {
  const refs = new Map(getDistrictTiles().map((tile) => [tile.slug, tile.ref]));
  assert.equal(refs.get("esenler"), "F2");
  assert.equal(refs.get("arnavutkoy"), "D1");
  assert.equal(refs.get("kadikoy"), "L3");
  assert.equal(refs.get("maltepe"), "M4");
  assert.equal(refs.get("sile"), "P1");
  assert.equal(refs.get("uskudar"), "L2");
  assert.equal(refs.get("sisli"), "H3");
  assert.equal(refs.get("catalca"), "B2");
  assert.equal(refs.get("esenyurt"), "C2");
  assert.equal(refs.get("adalar"), "M5");
  assert.equal(formatTileRef("F", 2), "F2");
});

test("Esenler's seven named neighbours all touch its F2 square", () => {
  const tiles = new Map(getDistrictTiles().map((tile) => [tile.slug, tile]));
  const esenler = tiles.get("esenler");
  assert.ok(esenler);
  const neighbours = [
    "bagcilar",
    "gungoren",
    "sultangazi",
    "bayrampasa",
    "basaksehir",
    "zeytinburnu",
    "gaziosmanpasa",
  ];
  for (const slug of neighbours) {
    const tile = tiles.get(slug);
    assert.ok(tile, slug);
    const columnDistance = Math.abs(
      tileGridColumn(tile.col) - tileGridColumn(esenler.col),
    );
    const rowDistance = Math.abs(tile.row - esenler.row);
    assert.ok(
      columnDistance <= 1 && rowDistance <= 1,
      `${slug} (${tile.ref}) does not touch F2`,
    );
  }
});

test("hyphenation marks only split the registry name", () => {
  for (const tile of getDistrictTiles()) {
    assert.equal(tile.breaks.split("|").join(""), tile.name);
    assert.doesNotMatch(tile.breaks, /^\||\|$|\|\|/);
    assert.equal(tile.label, tileLabel(tile.breaks));
    assert.equal(tile.label.replaceAll("\u00ad", ""), tile.name);
  }
  assert.equal(tileLabel("Esen|yurt"), "Esen\u00adyurt");
  assert.equal(getDistrictLabel("gaziosmanpasa"), "Gazi\u00adosman\u00adpaşa");
  assert.equal(getDistrictLabel("esenler"), "Esenler");
  assert.equal(getDistrictLabel("unknown"), null);
});

test("phone lists sort by Turkish alphabet", () => {
  const asia = sortTilesByName(
    getDistrictTiles().filter((tile) => tile.side === "anadolu"),
  ).map((tile) => tile.name);
  assert.deepEqual(asia, [
    "Adalar",
    "Ataşehir",
    "Beykoz",
    "Çekmeköy",
    "Kadıköy",
    "Kartal",
    "Maltepe",
    "Pendik",
    "Sancaktepe",
    "Sultanbeyli",
    "Şile",
    "Tuzla",
    "Ümraniye",
    "Üsküdar",
  ]);
  const europe = sortTilesByName(
    getDistrictTiles().filter((tile) => tile.side === "avrupa"),
  ).map((tile) => tile.name);
  assert.ok(europe.indexOf("Büyükçekmece") < europe.indexOf("Çatalca"));
  assert.ok(europe.indexOf("Çatalca") < europe.indexOf("Esenler"));
  assert.ok(europe.indexOf("Sultangazi") < europe.indexOf("Şişli"));
  assert.equal(europe.at(-1), "Zeytinburnu");
});
