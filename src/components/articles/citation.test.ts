import assert from "node:assert/strict";
import test from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { exampleEnglishArticle } from "@/content/articles/examples";
import { mapStaticArticle } from "@/content/articles/static-articles";
import { getDistrict } from "@/content/districts/district-registry";
import {
  apaAuthorName,
  apaCitation,
  articleCitationInput,
  bibtexCitation,
  citationMetaTags,
  districtCitationInput,
  istanbulDateParts,
  type CitationInput,
} from "./citation";
import CiteThis from "./CiteThis";

const esenler = getDistrict("esenler");
assert.ok(esenler);

// Published at 22:30 UTC on 12 September: already 13 September in Istanbul.
const guide = {
  publishedAt: "2026-09-12T22:30:00Z",
  updatedAt: "2026-09-27T11:00:00Z",
};

test("CITE-THIS: dates are Istanbul calendar days", () => {
  assert.deepEqual(istanbulDateParts("2026-09-12T22:30:00Z"), {
    year: "2026",
    month: "09",
    day: "13",
  });
  assert.equal(istanbulDateParts(null), null);
  assert.equal(istanbulDateParts("not a date"), null);
});

test("CITE-THIS: APA author names keep Turkish initials", () => {
  assert.equal(apaAuthorName("Şaban Durali", "tr"), "Durali, Ş.");
  assert.equal(apaAuthorName("ali rıza kaya", "tr"), "kaya, A. R.");
  assert.equal(apaAuthorName("İstanbul Büyükşehir", "tr"), "Büyükşehir, İ.");
  assert.equal(apaAuthorName("TÜİK", "tr"), "TÜİK");
});

test("CITE-THIS: a district guide cites the owner, its last update and its canonical URL", () => {
  const input = districtCitationInput(esenler, guide);
  assert.equal(
    apaCitation(input),
    "Durali, Ş. (2026, 27 Eylül). Esenler İlçe Rehberi. https://www.sabandurali.com/istanbul/ilceler/esenler",
  );
  assert.equal(
    bibtexCitation(input),
    [
      "@online{durali2026esenler,",
      "  author = {Durali, Şaban},",
      "  title = {{Esenler İlçe Rehberi}},",
      "  year = {2026},",
      "  date = {2026-09-13},",
      "  note = {Güncelleme: 2026-09-27},",
      "  organization = {Şaban Durali},",
      "  url = {https://www.sabandurali.com/istanbul/ilceler/esenler},",
      "  langid = {turkish}",
      "}",
    ].join("\n"),
  );
  assert.deepEqual(citationMetaTags(input), {
    citation_title: "Esenler İlçe Rehberi",
    citation_author: ["Şaban Durali"],
    citation_language: "tr",
    citation_public_url: "https://www.sabandurali.com/istanbul/ilceler/esenler",
    citation_publication_date: "2026/09/13",
  });
});

const guest: CitationInput = {
  title: "Rent & yield: 100% of the data?",
  authors: ["Jane Q. Doe", "Ali Kaya"],
  siteName: "Şaban Durali",
  url: "https://www.sabandurali.com/en/articles/rent",
  language: "en",
  publishedAt: "2026-03-01T09:00:00Z",
  modifiedAt: "2026-03-01T10:00:00Z",
};

test("CITE-THIS: guest authors name the site; BibTeX specials are escaped", () => {
  assert.equal(
    apaCitation(guest),
    "Doe, J. Q., & Kaya, A. (2026, March 1). Rent & yield: 100% of the data? Şaban Durali. https://www.sabandurali.com/en/articles/rent",
  );
  const bibtex = bibtexCitation(guest);
  assert.match(bibtex, /^@online\{doe2026rent,/);
  assert.match(bibtex, /author = \{Doe, Jane Q\. and Kaya, Ali\}/);
  assert.match(bibtex, /title = \{\{Rent \\& yield: 100\\% of the data\?\}\}/);
  // Same Istanbul day: no update note.
  assert.doesNotMatch(bibtex, /note =/);
  assert.match(bibtex, /langid = \{english\}/);
});

test("CITE-THIS: a missing date is said, not guessed", () => {
  const undated = { ...guest, publishedAt: null, modifiedAt: null };
  assert.match(apaCitation(undated), /\(n\.d\.\)/);
  assert.match(apaCitation({ ...undated, language: "tr" }), /\(t\.y\.\)/);
  assert.doesNotMatch(bibtexCitation(undated), /year =|date =/);
  assert.equal(citationMetaTags(undated).citation_publication_date, undefined);
});

test("CITE-THIS: an article cites its author line and canonical URL", () => {
  const article = mapStaticArticle(exampleEnglishArticle);
  const input = articleCitationInput(article);
  assert.equal(input.title, article.title);
  assert.equal(input.language, "en");
  assert.match(input.url, /^https:\/\/www\.sabandurali\.com\/en\/articles\//);
  assert.equal(input.publishedAt, article.publishedAt);
});

test("CITE-THIS: the disclosure renders both formats in each language", () => {
  const tr = renderToStaticMarkup(
    h(CiteThis, { citation: districtCitationInput(esenler, guide) }),
  );
  assert.match(tr, /^<details/);
  assert.match(tr, /<summary[^>]*><span>Nasıl atıf yapılır<\/span>/);
  assert.match(tr, /APA 7/);
  assert.match(tr, /BibTeX/);
  assert.match(tr, /<pre[^>]*whitespace-pre-wrap/);
  assert.match(tr, /Durali, Ş\. \(2026, 27 Eylül\)/);

  const en = renderToStaticMarkup(h(CiteThis, { citation: guest }));
  assert.match(en, /<span>How to cite<\/span>/);
});
