import type { SiteLocale } from "@/content/locales";

/*
 * Route parity manifest (LANG-SWITCH-FALLBACK): every public page route of
 * the Turkish and English route groups, written as App Router patterns
 * (`[slug]` is one segment). A route either has a counterpart in the other
 * language or says why it is Turkish only. route-parity.test.ts scans every
 * page.tsx under src/app/(tr) and src/app/(en) and fails on a route missing
 * here, so a new page has to decide this explicitly.
 *
 * The language switcher reads it to know whether its link to the other
 * language opens this page's translation or only a fallback (the other
 * home or list page), and then says so visibly.
 */
export type RouteParityEntry =
  | {
      kind: "pair";
      tr: string;
      en: string;
      /**
       * A detail route: each item is translated only when it has a published
       * counterpart; otherwise the page links the other list page.
       */
      perItem?: true;
    }
  | { kind: "tr-only"; tr: string; reason: string }
  | { kind: "not-found"; en: string; reason: string };

export const routeParity: readonly RouteParityEntry[] = [
  { kind: "pair", tr: "/", en: "/en" },
  { kind: "pair", tr: "/iletisim", en: "/en/contact" },
  { kind: "pair", tr: "/kvkk-aydinlatma-metni", en: "/en/privacy-notice" },
  { kind: "pair", tr: "/makaleler", en: "/en/articles" },
  {
    kind: "pair",
    tr: "/makaleler/[slug]",
    en: "/en/articles/[slug]",
    perItem: true,
  },
  { kind: "pair", tr: "/kitaplar", en: "/en/books" },
  {
    kind: "pair",
    tr: "/kitaplar/[slug]",
    en: "/en/books/[slug]",
    perItem: true,
  },
  { kind: "pair", tr: "/fotograflar", en: "/en/photography" },
  {
    kind: "pair",
    tr: "/fotograflar/[slug]",
    en: "/en/photography/[slug]",
    perItem: true,
  },
  // Site search (built in its own stream): both languages or neither.
  { kind: "pair", tr: "/ara", en: "/en/search" },
  {
    kind: "tr-only",
    tr: "/hakkimda",
    reason:
      "The English about text is the #about section of the English home page.",
  },
  {
    kind: "tr-only",
    tr: "/hakkimda/biyografi",
    reason: "The biography is written in Turkish only.",
  },
  {
    kind: "tr-only",
    tr: "/hakkimda/egitim-sertifikalar-diplomalar",
    reason: "The education and certificate records are Turkish only.",
  },
  {
    kind: "tr-only",
    tr: "/calisma-alanlari",
    reason:
      "The workspaces are Turkish only; English readers get the Focus Areas section of the home page.",
  },
  ...(
    [
      "/gayrimenkul-ve-istanbul",
      "/satis-ve-muzakere",
      "/arastirma-ve-analiz",
      "/yapay-zeka-ve-teknoloji",
      "/kitaplar-ve-ogrenme",
      "/fotograf",
    ] as const
  ).flatMap((workspace): RouteParityEntry[] => [
    {
      kind: "tr-only",
      tr: workspace,
      reason: "Workspace pages list Turkish publications only.",
    },
    {
      kind: "tr-only",
      tr: `${workspace}/[section]`,
      reason: "Workspace sections list Turkish publications only.",
    },
  ]),
  {
    kind: "tr-only",
    tr: "/istanbul/ilceler",
    reason: "The Istanbul district guide is published in Turkish only.",
  },
  {
    kind: "tr-only",
    tr: "/istanbul/ilceler/[district]",
    reason: "District guides are published in Turkish only.",
  },
  {
    kind: "tr-only",
    tr: "/istanbul/ilceler/[district]/haberler",
    reason: "District news is collected from Turkish sources only.",
  },
  {
    kind: "tr-only",
    tr: "/[slug]",
    reason: "CMS standard pages are published in Turkish only.",
  },
  {
    kind: "not-found",
    en: "/en/[...missing]",
    reason: "Renders the English 404 for unmatched /en addresses.",
  },
];

function segments(path: string): string[] {
  const pathname = path.split(/[?#]/, 1)[0] ?? path;
  return pathname.split("/").filter((segment) => segment !== "");
}

function isDynamic(segment: string): boolean {
  return segment.startsWith("[") && segment.endsWith("]");
}

/** Whether a concrete path is served by a route pattern. */
export function matchesRoute(pattern: string, path: string): boolean {
  const expected = segments(pattern);
  const actual = segments(path);
  if (expected.some((segment) => segment.startsWith("[..."))) return false;
  return (
    expected.length === actual.length &&
    expected.every((segment, index) =>
      isDynamic(segment) ? actual[index] !== "" : segment === actual[index],
    )
  );
}

function patternOf(
  entry: RouteParityEntry,
  locale: SiteLocale,
): string | undefined {
  if (entry.kind === "pair") return entry[locale];
  if (entry.kind === "tr-only") return locale === "tr" ? entry.tr : undefined;
  return locale === "en" ? entry.en : undefined;
}

/**
 * The manifest entry of a concrete path. A literal route wins over a
 * dynamic one (`/iletisim` is not the CMS page `/[slug]`).
 */
export function findRouteParity(
  path: string,
  locale: SiteLocale,
): RouteParityEntry | null {
  let best: { entry: RouteParityEntry; literals: number } | null = null;
  for (const entry of routeParity) {
    const pattern = patternOf(entry, locale);
    if (pattern === undefined || !matchesRoute(pattern, path)) continue;
    const literals = segments(pattern).filter((s) => !isDynamic(s)).length;
    if (best === null || literals > best.literals) best = { entry, literals };
  }
  return best?.entry ?? null;
}

/**
 * Whether `targetPath` (in `targetLocale`) is the translation of the page at
 * `ownPath` (in `ownLocale`): the route has a counterpart and the target is
 * that counterpart, not the other language's home or list page.
 */
export function isTranslationPath(
  ownPath: string,
  ownLocale: SiteLocale,
  targetPath: string,
  targetLocale: SiteLocale,
): boolean {
  if (ownLocale === targetLocale) return true;
  const entry = findRouteParity(ownPath, ownLocale);
  if (entry === null || entry.kind !== "pair") return false;
  return matchesRoute(entry[targetLocale], targetPath);
}
