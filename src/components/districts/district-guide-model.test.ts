import assert from "node:assert/strict";
import test from "node:test";
import type { DistrictSource } from "@/content/districts/district-content-policy";
import type { DistrictGuide } from "@/content/districts/district-guide-projection";
import { getDistrict } from "@/content/districts/district-registry";
import type { PublicPhoto } from "@/content/photos/types";
import { formatDistrictNumber } from "@/content/districts/district-presentation";
import { formatDate } from "@/lib/format-date";
import {
  buildDistrictFacts,
  buildMarketFacts,
  buildSourceRows,
  categoryLabel,
  districtGuideSections,
  districtPhotoCredit,
  extractLineCodes,
  getDistrictListSections,
  getVisibleDistrictSections,
  parseNeighbourSlugs,
  planningStatusLabel,
  sourceNumbersFor,
  splitParagraphs,
  splitSourceRows,
} from "./district-guide-model";

test("DISTRICT-MOBILE-NAV: the source list folds after three rows, from two hidden rows on", () => {
  const rows = (count: number) =>
    Array.from({ length: count }, (_, index) => index + 1);
  assert.deepEqual(splitSourceRows(rows(3)), { shown: [1, 2, 3], folded: [] });
  assert.deepEqual(splitSourceRows(rows(4)), {
    shown: [1, 2, 3, 4],
    folded: [],
  });
  assert.deepEqual(splitSourceRows(rows(5)), {
    shown: [1, 2, 3],
    folded: [4, 5],
  });
  assert.equal(splitSourceRows(rows(12)).folded.length, 9);
  assert.deepEqual(splitSourceRows([]), { shown: [], folded: [] });
});

const esenler = getDistrict("esenler");
assert.ok(esenler);

function source(overrides: Partial<DistrictSource>): DistrictSource {
  return {
    title: "Kaynak",
    publisher: "Yayıncı",
    url: "https://www.example.gov.tr/a",
    sourceType: "official",
    primary: true,
    dataDate: "2025-12-31T00:00:00.000Z",
    checkedAt: "2026-09-27T00:00:00.000Z",
    needsVerification: false,
    sections: ["summary"],
    ...overrides,
  };
}

function guide(overrides: Partial<DistrictGuide> = {}): DistrictGuide {
  return {
    summary: null,
    history: null,
    geography: null,
    life: null,
    transportation: null,
    placesGuide: null,
    distinctiveFeatures: null,
    researchTopics: null,
    facts: null,
    neighborhoods: [],
    housingTexture: null,
    regionalAssessment: null,
    marketData: null,
    planningDevelopments: [],
    sources: [],
    publishedAt: null,
    updatedAt: null,
    ...overrides,
  };
}

test("the section contract keeps the 14 ids of PROJECT-STATE §H in order", () => {
  assert.deepEqual(
    districtGuideSections.map((section) => section.id),
    [
      "genel-bakis",
      "tarihce",
      "tani",
      "yasam",
      "mahalleler",
      "gayrimenkul",
      "imar",
      "saha",
      "kareler",
      "kimlik",
      "arastirmalar",
      "haberler",
      "kaynaklar",
      "guncelleme",
    ],
  );
});

test("conditional sections drop out and the numbering stays consecutive", () => {
  for (const research of [false, true]) {
    for (const news of [false, true]) {
      const visible = getVisibleDistrictSections({ research, news });
      assert.equal(visible.length, 12 + Number(research) + Number(news));
      assert.deepEqual(
        visible.map((section) => section.number),
        visible.map((_, index) => index + 1),
      );
      assert.equal(
        visible.some((section) => section.id === "arastirmalar"),
        research,
      );
      assert.equal(
        visible.some((section) => section.id === "haberler"),
        news,
      );
      assert.equal(visible.at(-1)?.id, "guncelleme");
    }
  }
});

test("source numbers follow the list order and the sections a source supports", () => {
  const sources = [
    source({ sections: ["history"] }),
    source({ sections: ["facts", "summary"] }),
    source({ sections: ["neighborhoods"] }),
  ];
  assert.deepEqual(sourceNumbersFor(sources, ["history"]), [1]);
  assert.deepEqual(
    sourceNumbersFor(sources, ["facts", "neighborhoods"]),
    [2, 3],
  );
  assert.deepEqual(sourceNumbersFor(sources, ["marketData"]), []);
  assert.deepEqual(
    sourceNumbersFor([source({ sections: null })], ["summary"]),
    [],
  );
});

test("paragraphs split at blank lines and empty text has none", () => {
  assert.deepEqual(splitParagraphs("Bir.\n\n  İki.\n \nÜç."), [
    "Bir.",
    "İki.",
    "Üç.",
  ]);
  assert.deepEqual(splitParagraphs(null), []);
  assert.deepEqual(splitParagraphs("   "), []);
});

test("line codes come only from the published transport text", () => {
  assert.deepEqual(
    extractLineCodes(
      "İlçeyi M1B ve M7 hatları bağlar; M1B'nin Esenler durağı, T4 ve Marmaray aktarmaları. Kod sayılmayanlar: XM7, M7a.",
    ),
    ["M1B", "M7", "T4", "Marmaray"],
  );
  assert.deepEqual(extractLineCodes(null), []);
  assert.deepEqual(extractLineCodes("Otobüs ve minibüs."), []);
});

test("neighbour names resolve to registry slugs in the order named", () => {
  assert.deepEqual(
    parseNeighbourSlugs(
      "Bağcılar, Güngören, Sultangazi, Bayrampaşa, Başakşehir, Zeytinburnu ve Gaziosmanpaşa",
      "esenler",
    ),
    [
      "bagcilar",
      "gungoren",
      "sultangazi",
      "bayrampasa",
      "basaksehir",
      "zeytinburnu",
      "gaziosmanpasa",
    ],
  );
  assert.deepEqual(parseNeighbourSlugs("ŞİŞLİ; Esenler; Ankara", "esenler"), [
    "sisli",
  ]);
  assert.deepEqual(parseNeighbourSlugs(null), []);
});

test("fact rows carry only published values with section-level sources", () => {
  const sources = [
    source({ sections: ["history"] }),
    source({ sections: ["facts"] }),
    source({ sections: ["neighborhoods"] }),
  ];
  const facts = buildDistrictFacts(
    esenler,
    guide({
      facts: {
        population: "419878",
        populationYear: 2025,
        areaKm2: 18.43,
        neighborhoodCount: 19,
        neighboringDistricts: "Bağcılar ve Güngören",
      },
      sources,
    }),
  );
  assert.deepEqual(
    facts.map((fact) => [fact.id, fact.value, fact.unit, fact.date]),
    [
      ["population", "419.878", "kişi", "2025"],
      ["area", "18,43", "km²", undefined],
      ["neighbourhoods", "19", "mahalle", undefined],
      ["neighbours", "Bağcılar ve Güngören", undefined, undefined],
      ["side", "Avrupa Yakası", undefined, undefined],
    ],
  );
  assert.deepEqual(facts[0]?.sources, [2]);
  assert.deepEqual(facts[2]?.sources, [2, 3]);
  assert.equal(facts[4]?.sources, undefined);

  // Without a guide only the registry's side is known.
  assert.deepEqual(
    buildDistrictFacts(esenler, null).map((fact) => fact.id),
    ["side"],
  );
  // A public neighbourhood list without a fact count still gives a count.
  const fromList = buildDistrictFacts(
    esenler,
    guide({
      neighborhoods: [{ name: "Birlik" }, { name: "Tuna" }],
      sources,
    }),
  );
  assert.deepEqual(
    fromList.map((fact) => [fact.id, fact.value, fact.sources]),
    [
      ["neighbourhoods", "2", [3]],
      ["side", "Avrupa Yakası", undefined],
    ],
  );
});

test("source rows format dates in Istanbul time and name the sections", () => {
  const [row, recorded, undated] = buildSourceRows([
    source({
      title: "TÜİK",
      sections: ["facts", "summary"],
      dataDate: "2025-12-31T22:30:00.000Z",
      primary: false,
    }),
    // No URL may rewrite a recorded date: the row shows the source record.
    source({
      url: "https://www.kadikoy.gov.tr/ilcemizin-nufusu-son-1-yilda-849-kisi-azalarak-451453-oldu",
      dataDate: "2026-09-27T09:00:00.000Z",
    }),
    source({ dataDate: null, checkedAt: null, sections: null }),
  ]);
  assert.equal(row?.number, 1);
  assert.equal(row?.kind, "Resmî");
  assert.equal(row?.role, "İkincil aktarım");
  // 22:30 UTC on 31 December is 1 January in Istanbul.
  assert.equal(row?.dataDate, "1 Ocak 2026");
  assert.equal(row?.dataDateTime, "2025-12-31T22:30:00.000Z");
  assert.equal(row?.sections, "Temel veriler, Genel bakış");
  assert.equal(recorded?.dataDate, "27 Eylül 2026");
  assert.equal(recorded?.dataDateTime, "2026-09-27T09:00:00.000Z");
  assert.equal(undated?.dataDate, "Belirtilmemiş");
  assert.equal(undated?.checkedAt, "Belirtilmemiş");
  assert.equal(undated?.sections, "Belirtilmemiş");
});

function photo(overrides: Partial<PublicPhoto>): PublicPhoto {
  return {
    id: "1",
    language: "tr",
    title: "Kare",
    slug: "kare",
    description: null,
    image: { src: "/api/media/file/kare.jpg", alt: "Kare" },
    collections: [],
    tags: [],
    takenAt: null,
    locationName: null,
    district: "esenler",
    neighborhood: null,
    districtPhotoCategory: null,
    dayPeriod: null,
    photographer: "",
    creditLicense: null,
    exif: {
      camera: null,
      lens: null,
      focalLength: null,
      aperture: null,
      shutterSpeed: null,
      iso: null,
    },
    featured: false,
    publishedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    seo: { title: "", description: "", openGraphImage: null },
    ...overrides,
  };
}

test("photo credits keep the author, licence and archive record", () => {
  assert.deepEqual(
    districtPhotoCredit(
      photo({
        photographer: "Arşiv",
        creditLicense:
          "Kamu malı · Kaynak kaydı: https://commons.wikimedia.org/wiki/File:X.jpg",
      }),
    ),
    {
      author: "Arşiv",
      licence: "Kamu malı",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:X.jpg",
      sourceLabel: "Kaynak kaydı",
    },
  );
  assert.deepEqual(
    districtPhotoCredit(photo({ photographer: "Şaban Durali" })),
    { author: "Şaban Durali" },
  );
  assert.equal(districtPhotoCredit(photo({})), null);
  // A record "link" that is not http(s) is not turned into a link.
  assert.deepEqual(
    districtPhotoCredit(
      photo({ creditLicense: "CC BY 4.0 · Kaynak kaydı: javascript:alert(1)" }),
    ),
    { licence: "CC BY 4.0" },
  );
});

test("planning statuses map to labels and unknown values are hidden", () => {
  assert.equal(planningStatusLabel("insaat"), "İnşaat");
  assert.equal(planningStatusLabel("başka"), null);
  assert.equal(planningStatusLabel(null), null);
});

test("category slugs read as Turkish words", () => {
  // Every newsCategory option (src/collections/Articles.ts).
  for (const [slug, label] of [
    ["ulasim", "Ulaşım"],
    ["sehircilik", "Şehircilik"],
    ["belediye", "Belediye"],
    ["kultur", "Kültür"],
    ["yasam", "Yaşam"],
    ["gayrimenkul", "Gayrimenkul"],
    ["egitim", "Eğitim"],
    ["cevre", "Çevre"],
    ["onemli-yerel-gelismeler", "Önemli yerel gelişmeler"],
  ])
    assert.equal(categoryLabel(slug), label);
  // Every districtPhotoCategory option (src/collections/Photos.ts).
  for (const [slug, label] of [
    ["mimari", "Mimari"],
    ["sokak", "Sokak"],
    ["tarih", "Tarih"],
    ["doga", "Doğa"],
    ["gece", "Gece"],
  ])
    assert.equal(categoryLabel(slug), label);
  assert.equal(categoryLabel("yeni-kategori"), "yeni kategori");
  assert.equal(categoryLabel(null), null);
  assert.equal(categoryLabel(""), null);
});

test("research and news render with items or after a failed query", () => {
  const none = { research: [], news: [], unavailableSections: [] };
  assert.deepEqual(getDistrictListSections(none), {
    research: false,
    news: false,
  });
  assert.deepEqual(getDistrictListSections({ ...none, research: [{}] }), {
    research: true,
    news: false,
  });
  assert.deepEqual(
    getDistrictListSections({ ...none, unavailableSections: ["news"] }),
    { research: false, news: true },
  );
  // A failed photo query does not make the list sections appear.
  assert.deepEqual(
    getDistrictListSections({ ...none, unavailableSections: ["photos"] }),
    { research: false, news: false },
  );
});

test("market indicators use the district number format and skip missing values", () => {
  assert.deepEqual(buildMarketFacts(null, [1]), []);
  const rows = buildMarketFacts(
    {
      salePricePerM2: 45250.5,
      averageRent: null,
      dataDate: "2026-08-01T00:00:00Z",
    },
    [2],
  );
  assert.deepEqual(rows, [
    {
      id: "sale",
      label: "Ortalama m² satış fiyatı",
      value: formatDistrictNumber(45250.5),
      unit: "TL",
      date: formatDate("2026-08-01T00:00:00Z"),
      sources: [2],
    },
  ]);
  assert.equal(rows[0]?.value, "45.250,5");
  // An undated market row keeps an empty date rather than inventing one.
  assert.equal(buildMarketFacts({ averageRent: 21000 }, [])[0]?.date, "");
});

test("neighbour matching reuses the directory's Turkish search folding", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(
    new URL("./district-guide-model.ts", import.meta.url),
    "utf8",
  );
  // One folding rule for search and neighbour names (district-directory-filter).
  assert.doesNotMatch(source, /\.normalize\(/);
  assert.match(source, /foldSearchText/);
  assert.deepEqual(parseNeighbourSlugs("ŞİŞLİ ve beyoglu"), [
    "sisli",
    "beyoglu",
  ]);
});
