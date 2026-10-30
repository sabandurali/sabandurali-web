/**
 * IMAGE-DELIVERY (PERF-3): which image widths and qualities the optimizer
 * may generate, and the `sizes` the card grids announce. The config is read
 * as text: importing next.config.ts would run its production checks.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { cardGrids } from "@/components/pages/card-grid";

const config = readFileSync(path.join(process.cwd(), "next.config.ts"), "utf8");

function numberList(name: string): number[] {
  const match = new RegExp(`^\\s*${name}: \\[([^\\]]*)\\],$`, "m").exec(config);
  assert.ok(match?.[1], `${name} is set in next.config.ts`);
  return match[1].split(",").map((value) => Number(value.trim()));
}

test("IMAGE-DELIVERY: no generated source is wider than 1600 px", () => {
  const deviceSizes = numberList("deviceSizes");
  assert.deepEqual(deviceSizes, [640, 750, 828, 1080, 1200, 1600]);
  assert.ok(Math.max(...deviceSizes) <= 1600);
  assert.deepEqual(
    deviceSizes,
    deviceSizes.toSorted((left, right) => left - right),
  );
});

test("IMAGE-DELIVERY: only the default and the card quality are allowed", () => {
  assert.deepEqual(numberList("qualities"), [60, 75]);
});

test("IMAGE-DELIVERY: card grid sizes match their columns (snapshot)", () => {
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(cardGrids).map(([columns, grid]) => [columns, grid.sizes]),
    ),
    {
      3: "(min-width: 1280px) 420px, (min-width: 768px) 50vw, 100vw",
      4: "(min-width: 1280px) 320px, (min-width: 640px) 50vw, 100vw",
    },
  );
});
