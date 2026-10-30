import {
  getArticleAuthorName,
  getArticleCanonicalUrl,
} from "@/content/articles/article-seo";
import type { PublicArticle } from "@/content/articles/public-types";
import type { DistrictGuide } from "@/content/districts/district-guide-projection";
import type { District } from "@/content/districts/district-registry";
import { getDistrictUrl } from "@/content/districts/district-routes";
import { personalBrandName } from "@/content/entity-seo";
import type { SiteLocale } from "@/content/locales";
import { getContentLastModifiedIso } from "@/lib/content-dates";
import { SITE_TIME_ZONE } from "@/lib/format-date";

/**
 * "How to cite" texts for a published page: APA 7 and BibTeX, plus the
 * Highwire `citation_*` meta tags that reference managers and Google
 * Scholar read. Pure and dated in Europe/Istanbul, like every date on the
 * site. Only facts the page already publishes go in: its title, author,
 * canonical URL and dates. A missing date reads "t.y." / "n.d.", never a
 * guessed one.
 */
export type CitationInput = {
  title: string;
  /** Full names as the page shows them ("Şaban Durali"). */
  authors: readonly string[];
  /** The publishing site, named in APA only when it is not the author. */
  siteName: string;
  /** Canonical absolute URL. */
  url: string;
  language: SiteLocale;
  /** ISO publication time. */
  publishedAt: string | null;
  /** ISO time of the last change (getContentLastModifiedIso). */
  modifiedAt: string | null;
};

type DateParts = { year: string; month: string; day: string };

const numericParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: SITE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const monthNames: Record<SiteLocale, Intl.DateTimeFormat> = {
  tr: new Intl.DateTimeFormat("tr-TR", {
    timeZone: SITE_TIME_ZONE,
    month: "long",
  }),
  en: new Intl.DateTimeFormat("en-US", {
    timeZone: SITE_TIME_ZONE,
    month: "long",
  }),
};

function toDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

/** Calendar day of an instant in Istanbul, or null for a missing date. */
export function istanbulDateParts(value: string | null): DateParts | null {
  const date = toDate(value);
  if (date === null) return null;
  const parts = numericParts.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return { year: part("year"), month: part("month"), day: part("day") };
}

const isoDay = (parts: DateParts) =>
  `${parts.year}-${parts.month}-${parts.day}`;

const noDate: Record<SiteLocale, string> = { tr: "t.y.", en: "n.d." };

/** APA date: the last update when there is one, else the publication. */
function apaDate(input: CitationInput): string {
  const value = input.modifiedAt ?? input.publishedAt;
  const date = toDate(value);
  const parts = istanbulDateParts(value);
  if (date === null || parts === null) return noDate[input.language];
  const month = monthNames[input.language].format(date);
  const day = String(Number(parts.day));
  return input.language === "tr"
    ? `${parts.year}, ${day} ${month}`
    : `${parts.year}, ${month} ${day}`;
}

function nameParts(name: string): { family: string; given: string[] } {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const family = words.at(-1) ?? "";
  return { family, given: words.slice(0, -1) };
}

/** "Şaban Durali" → "Durali, Ş."; a one-word name (an institution) stays. */
export function apaAuthorName(name: string, language: SiteLocale): string {
  const { family, given } = nameParts(name);
  if (given.length === 0) return family;
  const initials = given
    .map((word) => `${word.charAt(0).toLocaleUpperCase(language)}.`)
    .join(" ");
  return `${family}, ${initials}`;
}

function apaAuthors(input: CitationInput): string {
  const names = input.authors.map((name) =>
    apaAuthorName(name, input.language),
  );
  if (names.length <= 1) return names[0] ?? input.siteName;
  const and = input.language === "tr" ? "ve" : "&";
  return `${names.slice(0, -1).join(", ")}, ${and} ${names.at(-1)}`;
}

const endsWithPunctuation = (value: string) => /[.?!]$/.test(value);

/** APA 7 reference of a web page. */
export function apaCitation(input: CitationInput): string {
  const authors = apaAuthors(input);
  const title = input.title.trim();
  const titlePart = endsWithPunctuation(title) ? title : `${title}.`;
  const sitePart =
    input.authors.length === 1 && input.authors[0] === input.siteName
      ? ""
      : ` ${input.siteName}.`;
  const authorPart = endsWithPunctuation(authors) ? authors : `${authors}.`;
  return `${authorPart} (${apaDate(input)}). ${titlePart}${sitePart} ${input.url}`;
}

/** BibTeX value with the special characters escaped. */
function bibtexValue(value: string): string {
  return value.replace(/[\\{}&%$#_~^]/g, (char) => {
    if (char === "\\") return "\\textbackslash{}";
    if (char === "~") return "\\textasciitilde{}";
    if (char === "^") return "\\textasciicircum{}";
    return `\\${char}`;
  });
}

function asciiWord(value: string): string {
  return value
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .normalize("NFKD")
    .replace(/[^a-z0-9]/g, "");
}

/** BibTeX (biblatex @online) entry. */
export function bibtexCitation(input: CitationInput): string {
  const published = istanbulDateParts(input.publishedAt);
  const modified = istanbulDateParts(input.modifiedAt ?? input.publishedAt);
  const firstAuthor = input.authors[0] ?? input.siteName;
  const firstWord =
    input.title
      .split(/\s+/)
      .map(asciiWord)
      .find((word) => word.length > 0) ?? "";
  const key = `${asciiWord(nameParts(firstAuthor).family) || "web"}${published?.year ?? ""}${firstWord}`;
  const authors = input.authors
    .map((name) => {
      const { family, given } = nameParts(name);
      return given.length === 0
        ? `{${bibtexValue(family)}}`
        : `${bibtexValue(family)}, ${bibtexValue(given.join(" "))}`;
    })
    .join(" and ");
  const fields: [string, string][] = [
    ["author", authors || `{${bibtexValue(input.siteName)}}`],
    ["title", `{${bibtexValue(input.title.trim())}}`],
  ];
  const publishedDay = published ? isoDay(published) : null;
  const modifiedDay = modified ? isoDay(modified) : null;
  if (published && publishedDay) {
    fields.push(["year", published.year]);
    fields.push(["date", publishedDay]);
  }
  if (modifiedDay && publishedDay && modifiedDay !== publishedDay) {
    fields.push([
      "note",
      input.language === "tr"
        ? `Güncelleme: ${modifiedDay}`
        : `Updated ${modifiedDay}`,
    ]);
  }
  fields.push(["organization", bibtexValue(input.siteName)]);
  fields.push(["url", input.url]);
  fields.push(["langid", input.language === "tr" ? "turkish" : "english"]);
  const body = fields
    .map(([name, value]) => `  ${name} = {${value}}`)
    .join(",\n");
  return `@online{${key},\n${body}\n}`;
}

/**
 * Highwire `citation_*` meta tags (Google Scholar, Zotero), shaped for the
 * Next.js Metadata `other` field. The publication date is the Istanbul
 * calendar day in the "YYYY/MM/DD" form Scholar expects.
 */
export function citationMetaTags(
  input: CitationInput,
): Record<string, string | string[]> {
  const published = istanbulDateParts(input.publishedAt);
  const tags: Record<string, string | string[]> = {
    citation_title: input.title.trim(),
    citation_author: [...input.authors],
    citation_language: input.language,
    citation_public_url: input.url,
  };
  if (published) {
    tags.citation_publication_date = `${published.year}/${published.month}/${published.day}`;
  }
  return tags;
}

/** Citation of an article: its author line, canonical URL and dates. */
export function articleCitationInput(article: PublicArticle): CitationInput {
  return {
    title: article.title,
    authors: [getArticleAuthorName(article)],
    siteName: personalBrandName,
    url: getArticleCanonicalUrl(article),
    language: article.language,
    publishedAt: article.publishedAt,
    modifiedAt: getContentLastModifiedIso(article) ?? null,
  };
}

/**
 * Citation of a published district guide, named like its JSON-LD WebPage
 * ("<İlçe> İlçe Rehberi"). The site owner is the author, as the page title
 * says; the dates are the guide's publication and last change.
 */
export function districtCitationInput(
  district: Pick<District, "name" | "slug">,
  guide: Pick<DistrictGuide, "publishedAt" | "updatedAt">,
): CitationInput {
  return {
    title: `${district.name} İlçe Rehberi`,
    authors: [personalBrandName],
    siteName: personalBrandName,
    url: getDistrictUrl(district.slug),
    language: "tr",
    publishedAt: guide.publishedAt,
    modifiedAt: getContentLastModifiedIso(guide) ?? null,
  };
}
