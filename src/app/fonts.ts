import { Archivo, Martian_Mono } from "next/font/google";

/*
 * İstanbul Atlası typefaces (docs/DESIGN-SYSTEM.md → Typography).
 *
 * Both are variable fonts loaded with their width axis, so `font-stretch`
 * (the `--stretch-*` tokens in globals.css) selects the width:
 * Archivo 62–125 %, Martian Mono 75–112.5 %. The weight axis comes with the
 * variable font; no italic or other static face is requested.
 *
 * `latin-ext` carries ğ Ğ ı İ ş Ş, so Turkish text never waits for a second,
 * late file. Archivo sets every heading and paragraph and is preloaded.
 * Martian Mono only sets data labels (values, dates, grid refs, line codes):
 * it is not preloaded and downloads when a page first uses it.
 *
 * Next.js self-hosts the files at build time; browsers never call Google.
 */
export const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-archivo",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});

export const martianMono = Martian_Mono({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  display: "swap",
  preload: false,
  variable: "--font-martian-mono",
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
