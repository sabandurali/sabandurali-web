import assert from "node:assert/strict";
import test from "node:test";
import { getSegmentStyles } from "./station-diagram";

const m1b = [
  { name: "Kirazlı", note: "hat ucu, M3 aktarması" },
  { name: "Üçyüzlü", note: "ilçe içinde", serves: true },
  { name: "Menderes", note: "ilçe içinde", serves: true },
  { name: "Esenler", note: "ilçe içinde", serves: true },
  { name: "Otogar", note: "Bayrampaşa’da" },
  { name: "Yenikapı", note: "hat ucu" },
];

test("the line is solid only between stations that serve the district", () => {
  assert.deepEqual(getSegmentStyles(m1b), [
    "dotted",
    "solid",
    "solid",
    "dotted",
    "dotted",
  ]);
});

test("a line with one station or none has no segments", () => {
  assert.deepEqual(getSegmentStyles([{ name: "Tek" }]), []);
  assert.deepEqual(getSegmentStyles([]), []);
});
