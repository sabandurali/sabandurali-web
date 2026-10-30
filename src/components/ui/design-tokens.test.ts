import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { compile } from "tailwindcss";
import { contrastRatio } from "./contrast";

/*
 * Guards for src/app/globals.css (the İstanbul Atlası tokens), the contrast
 * table of docs/DESIGN-SYSTEM.md and the font setup in src/app/fonts.ts.
 */

const root = new URL("../../../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

const css = read("src/app/globals.css").replace(/\/\*[\s\S]*?\*\//g, "");
const designDoc = read("docs/DESIGN-SYSTEM.md");

type Block = { prelude: string; body: string | null };

/** Top-level statements and blocks of a stylesheet (comments removed). */
function topLevelBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  let depth = 0;
  let preludeStart = 0;
  let bodyStart = 0;
  let prelude = "";
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") {
      if (depth === 0) {
        prelude = source.slice(preludeStart, index).trim();
        bodyStart = index + 1;
      }
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        blocks.push({ prelude, body: source.slice(bodyStart, index) });
        preludeStart = index + 1;
      }
    } else if (char === ";" && depth === 0) {
      blocks.push({
        prelude: source.slice(preludeStart, index).trim(),
        body: null,
      });
      preludeStart = index + 1;
    }
  }
  assert.equal(depth, 0, "unbalanced braces in globals.css");
  return blocks;
}

function declarations(body: string): Map<string, string> {
  const result = new Map<string, string>();
  for (const match of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    const [, name, value] = match;
    if (name && value) result.set(name, value.replace(/\s+/g, " ").trim());
  }
  return result;
}

const blocks = topLevelBlocks(css);
const blocksNamed = (prelude: string) =>
  blocks.filter((block) => block.prelude === prelude);
const bodyOf = (prelude: string) =>
  blocksNamed(prelude)
    .map((block) => block.body ?? "")
    .join("\n");

const colors = new Map<string, string>();
for (const [name, value] of declarations(bodyOf("@theme static"))) {
  if (name.startsWith("--color-"))
    colors.set(name.slice("--color-".length), value);
}
const typeTokens = declarations(bodyOf("@theme"));
const baseBody = bodyOf("@layer base");

function color(token: string): string {
  const value = colors.get(token);
  assert.ok(value, `missing colour token --color-${token}`);
  assert.match(value, /^#[0-9a-f]{6}$/i, `--color-${token} must be #rrggbb`);
  return value;
}

/** Arguments of a CSS function, split on top-level commas. */
function functionArguments(value: string, name: string): string[] | null {
  const prefix = `${name}(`;
  if (!value.startsWith(prefix) || !value.endsWith(")")) return null;
  const inner = value.slice(prefix.length, -1);
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < inner.length; index += 1) {
    const char = inner[index];
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(inner.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(inner.slice(start).trim());
  return parts;
}

/**
 * Lower bound of a font-size value, in rem (16 px). clamp() is bounded by
 * its first argument, min() by its smallest, max() by its largest; a bare
 * calc() has no static bound and counts as 0, so it must sit inside a max()
 * with a real floor.
 */
function minimumRem(value: string): number {
  const trimmed = value.replace(/\s+/g, " ").trim();
  const variable = /^var\((--[a-z0-9-]+)\)$/i.exec(trimmed);
  if (variable?.[1]) {
    const token = typeTokens.get(variable[1]);
    assert.ok(token, `unknown size token ${variable[1]}`);
    return minimumRem(token);
  }
  const clamp = functionArguments(trimmed, "clamp");
  if (clamp?.[0]) return minimumRem(clamp[0]);
  const min = functionArguments(trimmed, "min");
  if (min) return Math.min(...min.map(minimumRem));
  const max = functionArguments(trimmed, "max");
  if (max) return Math.max(...max.map(minimumRem));
  if (trimmed.startsWith("calc(")) return 0;
  const length = /^(\d*\.?\d+)(rem|px)$/i.exec(trimmed);
  assert.ok(length?.[1] && length[2], `unsupported font-size value: ${value}`);
  const amount = Number(length[1]);
  return length[2].toLowerCase() === "px" ? amount / 16 : amount;
}

test("the font-size bound reader handles clamp, min, max and calc", () => {
  assert.equal(minimumRem("clamp(2rem, 1rem + 2vw, 3rem)"), 2);
  assert.equal(minimumRem("min(1rem, max(0.75rem, calc(100cqi / 9)))"), 0.75);
  assert.equal(minimumRem("calc(100cqi / 9)"), 0);
  assert.equal(minimumRem("12px"), 0.75);
});

test("FE-12: every rule is layered or a token block; nothing overrides utilities", () => {
  const allowed =
    /^@(import\b|theme( static| inline)?$|layer base$|utility [a-z0-9-]+$)/;
  for (const block of blocks) {
    assert.match(block.prelude, allowed, `unlayered rule: ${block.prelude}`);
  }
  assert.ok(
    blocks.some((block) => block.prelude.startsWith('@import "tailwindcss"')),
  );
  for (const selector of [
    "body {",
    "h1,",
    ":focus-visible {",
    "main {",
    "::selection {",
  ]) {
    assert.ok(
      baseBody.includes(selector),
      `${selector} belongs in @layer base`,
    );
  }
});

const focusRule = /:focus-visible\s*\{([^}]*)\}/.exec(baseBody)?.[1] ?? "";

test("FE-4: the two-tone focus ring is visible on every ground", () => {
  const focus = focusRule;
  assert.match(
    focus,
    /outline:\s*var\(--focus-ring-width\) solid var\(--focus-ring\)/,
  );
  assert.match(
    focus,
    /box-shadow:\s*0 0 0 var\(--focus-ring-offset\) var\(--focus-halo\)/,
  );

  const rootVariables = declarations(
    /:root\s*\{([^}]*)\}/.exec(baseBody)?.[1] ?? "",
  );
  assert.equal(rootVariables.get("--focus-ring"), "var(--color-ink)");
  assert.equal(rootVariables.get("--focus-halo"), "#ffffff");
  const ring = color("ink");
  const halo = "#ffffff";

  assert.ok(contrastRatio(ring, halo) >= 3, "ring and halo must contrast");
  for (const ground of ["paper", "land", "band", "mist", "signal"]) {
    assert.ok(
      contrastRatio(ring, color(ground)) >= 3,
      `ink ring on ${ground} is below 3:1`,
    );
  }
  assert.ok(
    contrastRatio(halo, color("sea")) >= 3,
    "white halo on sea is below 3:1",
  );
});

const tailwindRoot = path.dirname(
  createRequire(import.meta.url).resolve("tailwindcss/package.json"),
);

/** globals.css compiled by the project's Tailwind for the given classes. */
async function buildCss(candidates: string[]): Promise<string> {
  const compiler = await compile(read("src/app/globals.css"), {
    base: fileURLToPath(new URL("src/app/", root)),
    async loadStylesheet(id, base) {
      const file =
        id === "tailwindcss"
          ? path.join(tailwindRoot, "index.css")
          : path.resolve(base, id);
      return {
        path: file,
        base: path.dirname(file),
        content: readFileSync(file, "utf8"),
      };
    },
  });
  return compiler.build(candidates);
}

test("FE-4: shadow and ring utilities keep the focus halo", async () => {
  // A shadow utility replaces box-shadow; the halo survives only because
  // the base rule also feeds Tailwind's shadow stack. Without it a focused
  // shadowed control (BackToTop) shows the ink ring alone, 1.3:1 on navy.
  assert.match(
    focusRule,
    /--tw-ring-offset-shadow:\s*0 0 0 var\(--focus-ring-offset\) var\(--focus-halo\)/,
  );
  const utilities = ["shadow-lg", "shadow-panel", "ring-2"];
  const output = await buildCss(utilities);
  for (const utility of utilities) {
    const rule =
      new RegExp(`\\.${utility} \\{([^}]*)\\}`).exec(output)?.[1] ?? "";
    assert.match(
      rule,
      /box-shadow:[^;]*var\(--tw-ring-offset-shadow\)/,
      `${utility} must compose the halo`,
    );
    assert.doesNotMatch(rule, /--tw-ring-offset-shadow:/, utility);
  }
});

test("FE-4: ui components drop the halo only with box-shadow:none", () => {
  // `shadow-none` composes the halo back in; a component that draws the
  // ring elsewhere (Card) must remove it with [box-shadow:none].
  const directory = fileURLToPath(new URL("src/components/ui/", root));
  for (const file of readdirSync(directory)) {
    if (!file.endsWith(".tsx")) continue;
    assert.doesNotMatch(
      readFileSync(path.join(directory, file), "utf8"),
      /\bfocus(?:-visible)?:shadow-none\b/,
      file,
    );
  }
});

test("FE-6: the documented contrast table matches the tokens and passes AA", () => {
  const rows = [
    ...designDoc.matchAll(
      /^\|\s*`([a-z-]+)`\s*\|\s*`([a-z-]+)`\s*\|\s*(\d+\.\d{2}):1\s*\|\s*(text|large|ui|decorative)\s*\|/gm,
    ),
  ];
  assert.ok(
    rows.length >= 30,
    "contrast table not found in docs/DESIGN-SYSTEM.md",
  );

  const minimum = { text: 4.5, large: 3, ui: 3, decorative: 0 } as const;
  const documented = new Map<string, keyof typeof minimum>();
  for (const [, foreground, background, ratio, use] of rows) {
    assert.ok(foreground && background && ratio && use);
    const actual = contrastRatio(color(foreground), color(background));
    assert.equal(
      actual.toFixed(2),
      ratio,
      `${foreground} on ${background}: documented ${ratio}, actual ${actual.toFixed(2)}`,
    );
    const requirement = use as keyof typeof minimum;
    assert.ok(
      actual >= minimum[requirement],
      `${foreground} on ${background} (${actual.toFixed(2)}) fails ${use}`,
    );
    documented.set(`${foreground}/${background}`, requirement);
  }

  const lightGrounds = ["paper", "land", "band", "mist"];
  const requiredText = [
    ...["ink", "ink-muted", "signal-ink"].flatMap((foreground) =>
      lightGrounds.map((ground) => `${foreground}/${ground}`),
    ),
    "danger/paper",
    "danger/land",
    "danger/band",
    "ink/signal",
    "on-sea/sea",
    "on-sea-soft/sea",
    "on-sea-muted/sea",
    "on-sea/sea-line",
    "sea/on-sea",
  ];
  for (const pair of requiredText) {
    assert.equal(
      documented.get(pair),
      "text",
      `${pair} must be documented as text`,
    );
  }
  const requiredUi = [
    ...lightGrounds.map((ground) => `tile-edge/${ground}`),
    "signal/sea",
    "sea-track/sea",
    "sea-track/land",
  ];
  for (const pair of requiredUi) {
    assert.ok(documented.has(pair), `${pair} must be documented`);
    assert.notEqual(
      documented.get(pair),
      "decorative",
      `${pair} is a UI boundary`,
    );
  }
});

test("signal orange never passes as text on light grounds, so it stays a fill", () => {
  for (const ground of ["paper", "land", "band", "mist"]) {
    assert.ok(contrastRatio(color("signal"), color(ground)) < 4.5);
  }
});

test("the retired navy and gold palette stays deleted", () => {
  const retired = [
    "background",
    "background-deep",
    "foreground",
    "surface",
    "surface-soft",
    "ivory",
    "ivory-soft",
    "muted",
    "muted-dark",
    "placeholder",
    "border",
    "accent",
    "accent-strong",
    "accent-soft",
    "accent-deep",
    "accent-hero-glow",
    "accent-border-soft",
    "accent-border-hover",
  ];
  const defined = new Set(
    [...css.matchAll(/--(?:color-)?([a-z][a-z0-9-]*)\s*:/g)].map(
      (match) => match[1],
    ),
  );
  assert.deepEqual(
    retired.filter((name) => defined.has(name)),
    [],
    "legacy token defined in globals.css; use the atlas tokens",
  );
  assert.doesNotMatch(css, /#101d32|#c9a24a/i);
});

test("FE-20: no type token or font-size in globals.css is below 12 px", () => {
  const sizeTokens = [...typeTokens].filter(
    ([name]) => name.startsWith("--text-") && !name.includes("--line-height"),
  );
  assert.ok(sizeTokens.length >= 15);
  for (const [name, value] of sizeTokens) {
    assert.ok(minimumRem(value) >= 0.75, `${name} (${value}) is below 12 px`);
  }
  const fontSizes = [...css.matchAll(/font-size:\s*([^;]+);/g)];
  assert.ok(fontSizes.length > 10);
  for (const [, value] of fontSizes) {
    assert.ok(
      value && minimumRem(value) >= 0.75,
      `font-size ${value} is below 12 px`,
    );
  }
});

/** Content of the `{ … }` block that follows `marker` in `source`. */
function blockAfter(source: string, marker: string): string {
  const start = source.indexOf(marker);
  assert.ok(start >= 0, `missing ${marker}`);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(open + 1, index);
  }
  throw new Error(`unclosed block after ${marker}`);
}

test("motion: reduced motion stops animation and smooth scrolling is opt-in", () => {
  const reduced = blockAfter(
    baseBody,
    "@media (prefers-reduced-motion: reduce)",
  );
  for (const property of [
    "animation-duration: 0.01ms !important",
    "transition-duration: 0.01ms !important",
    "scroll-behavior: auto !important",
  ]) {
    assert.ok(reduced.includes(property), property);
  }
  assert.equal([...css.matchAll(/scroll-behavior:\s*smooth/g)].length, 1);
  const motionSafe = blockAfter(
    baseBody,
    "@media (prefers-reduced-motion: no-preference)",
  );
  assert.match(motionSafe, /scroll-behavior:\s*smooth/);
});

test("FE-17: fonts.ts loads only the trimmed Archivo and Martian Mono files", () => {
  const fonts = read("src/app/fonts.ts");
  assert.match(fonts, /import localFont from "next\/font\/local";/);
  assert.doesNotMatch(fonts, /next\/font\/google/);
  const calls = [...fonts.matchAll(/= localFont\(\{([\s\S]*?)\}\);/g)];
  assert.deepEqual(
    calls.map(([, options]) => /src: "([^"]+)"/.exec(options ?? "")?.[1]),
    ["./_fonts/archivo-latin-tr.woff2", "./_fonts/martian-mono-latin-tr.woff2"],
  );
  for (const [, options] of calls) {
    assert.ok(options);
    assert.match(options, /display: "swap"/);
    assert.match(options, /weight: "\d{3} \d{3}"/, "a variable weight range");
    assert.match(options, /prop: "font-stretch"/);
  }
  assert.match(
    calls[1]?.[1] ?? "",
    /preload: false/,
    "Martian Mono is not preloaded",
  );
  assert.doesNotMatch(
    calls[0]?.[1] ?? "",
    /preload: false/,
    "Archivo is preloaded",
  );
});

test("FE-17: the public root layouts take their fonts from fonts.ts only", () => {
  for (const layout of ["src/app/(tr)/layout.tsx", "src/app/(en)/layout.tsx"]) {
    const source = read(layout);
    assert.doesNotMatch(
      source,
      /next\/font|Geist/,
      `${layout} loads its own font`,
    );
    assert.match(source, /fontVariables/, `${layout} must apply fontVariables`);
    assert.match(source, /data-scroll-behavior="smooth"/, layout);
  }
});

test("FRONTEND-4: region labels are capitals whatever case the content uses", async () => {
  const output = await buildCss(["type-region"]);
  const rule = /\.type-region \{([^}]*)\}/.exec(output)?.[1] ?? "";
  assert.match(rule, /text-transform:\s*uppercase/);
  assert.match(rule, /letter-spacing:\s*0\.16em/);
});

test("FRONTEND-4: form controls and the md button share the 16 px type-control role", async () => {
  const output = await buildCss(["type-control"]);
  const rule = /\.type-control \{([^}]*)\}/.exec(output)?.[1] ?? "";
  assert.match(rule, /font-size:\s*var\(--text-control\)/);
  assert.match(rule, /line-height:\s*var\(--text-control--line-height\)/);
  assert.match(read("src/app/globals.css"), /--text-control:\s*1rem;/);
  assert.match(read("src/components/ui/Field.tsx"), /\btype-control\b/);
  assert.match(
    read("src/components/ui/Button.tsx"),
    /md: "[^"]*\btype-control\b/,
  );
  assert.match(read("docs/DESIGN-SYSTEM.md"), /\| `type-control` \|/);
});
