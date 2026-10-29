import assert from "node:assert/strict";
import test from "node:test";
import { districts } from "@/content/districts/district-registry";
import {
  directoryLetters,
  filterDirectoryEntries,
  foldSearchText,
  isDirectorySide,
  sortDirectoryEntries,
  type DirectoryFilter,
} from "./district-directory-filter";

const entries = districts.map(({ name, slug, side }) => ({ name, slug, side }));
const all: DirectoryFilter = { query: "", side: "all", letter: "" };
const slugs = (filter: Partial<DirectoryFilter>) =>
  filterDirectoryEntries(entries, { ...all, ...filter }).map(
    (entry) => entry.slug,
  );

test("search ignores case, Turkish diacritics and the dotless i", () => {
  assert.equal(foldSearchText("ŞİŞLİ"), "sisli");
  assert.equal(foldSearchText("Kadıköy"), "kadikoy");
  assert.deepEqual(slugs({ query: "kadikoy" }), ["kadikoy"]);
  assert.deepEqual(slugs({ query: "  Şişli " }), ["sisli"]);
  assert.deepEqual(slugs({ query: "olmayan" }), []);
});

test("side and letter filters match the acceptance expectations", () => {
  assert.equal(slugs({}).length, 39);
  assert.equal(slugs({ side: "avrupa" }).length, 25);
  assert.equal(slugs({ side: "anadolu" }).length, 14);
  assert.deepEqual(slugs({ letter: "Ş" }), ["sile", "sisli"]);
  assert.deepEqual(slugs({ letter: "Ş", side: "avrupa" }), ["sisli"]);
});

test("Turkish alphabetical order: Ç after C, Ş after S, Ü after U", () => {
  const sorted = sortDirectoryEntries(entries).map((entry) => entry.name);
  assert.ok(sorted.indexOf("Çatalca") > sorted.indexOf("Büyükçekmece"));
  assert.ok(sorted.indexOf("Çekmeköy") < sorted.indexOf("Esenler"));
  assert.ok(sorted.indexOf("Şile") > sorted.indexOf("Sultanbeyli"));
  assert.ok(sorted.indexOf("Ümraniye") > sorted.indexOf("Tuzla"));
  const letters = directoryLetters(entries);
  assert.equal(new Set(letters).size, letters.length);
  assert.deepEqual(letters.slice(0, 4), ["A", "B", "Ç", "E"]);
  assert.ok(letters.includes("Ş") && letters.includes("Ü"));
});

test("only known sides are accepted from the select", () => {
  assert.equal(isDirectorySide("all"), true);
  assert.equal(isDirectorySide("anadolu"), true);
  assert.equal(isDirectorySide("asya"), false);
});
