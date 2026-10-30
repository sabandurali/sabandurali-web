import localFont from "next/font/local";

/*
 * İstanbul Atlası typefaces (docs/DESIGN-SYSTEM.md → Typography).
 *
 * Self-hosted, trimmed variable fonts built by scripts/fonts/subset-fonts.mjs
 * (PERF-FONTS): one Latin + Turkish woff2 per family, limited to the axes
 * the design system uses.
 *
 * - Archivo: weight 400–800 and width 76–125 %, so `font-stretch` (the
 *   `--stretch-*` tokens in globals.css) selects the width. It sets every
 *   heading and paragraph and is preloaded.
 * - Martian Mono: weight 500–700 at the one width the site uses
 *   (`--stretch-mono`, 87.5 %, built into the file). It only sets data
 *   labels (values, dates, grid refs, line codes): it is not preloaded and
 *   downloads when a page first uses it.
 *
 * ı İ ş Ş ğ Ğ are in the same file as Latin, so Turkish text never waits
 * for a second, late file (scripts/fonts/subset-fonts.test.mjs checks the
 * glyphs, the axes and the size budget). The `font-stretch` descriptor
 * tells the browser the width range Archivo covers.
 */
export const archivo = localFont({
  src: "./fonts/archivo-latin-tr.woff2",
  weight: "400 800",
  style: "normal",
  display: "swap",
  variable: "--font-archivo",
  declarations: [{ prop: "font-stretch", value: "76% 125%" }],
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});

export const martianMono = localFont({
  src: "./fonts/martian-mono-latin-tr.woff2",
  weight: "500 700",
  style: "normal",
  display: "swap",
  preload: false,
  // next/font/local can only tune an Arial or Times fallback; the swap
  // period uses the monospace stack below instead.
  adjustFontFallback: false,
  variable: "--font-martian-mono",
  declarations: [{ prop: "font-stretch", value: "87.5%" }],
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Consolas",
    "monospace",
  ],
});

/** Class names that define the font variables; put them on `<html>`. */
export const fontVariables = `${archivo.variable} ${martianMono.variable}`;
