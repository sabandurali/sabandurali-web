// Representative, clearly fictional CMS records that the CI end-to-end
// checks render: one published article (TR and EN), one district news item,
// one book review (TR and EN), two photos (both in the district guide's
// photo section), one standard page with every non-home CMS block, one
// published district guide and a published Navigation global. They exist
// only in the CI SQLite database that `scripts/ci/seed-fixtures.ts` writes;
// nothing here is site content.
//
// Every visible text says it is a test fixture, so a screenshot or report can
// never be mistaken for a real article, review, photo or district fact. The
// district guide states no number, name or date about the district: its
// only figure is the count of its own two fictional neighbourhood rows, its
// sources are `example.*` addresses and every date is relative to the seed.
// The module is pure (no Payload, no database), so node:test checks it.

/** Marker that every fixture title and credit carries. */
export const FIXTURE_MARK = "CI test kaydı";
export const FIXTURE_MARK_EN = "CI test record";

/** The district the news, photo and guide fixtures are filed under. */
export const FIXTURE_DISTRICT = "esenler";

/** Slugs of the fixture records, shared with the a11y route list. */
export const fixtureSlugs = Object.freeze({
  articleTr: "ci-test-makalesi",
  articleEn: "ci-test-article",
  districtNews: "ci-test-ilce-haberi",
  bookTr: "ci-test-kitap-incelemesi",
  bookEn: "ci-test-book-review",
  photoTr: "ci-test-fotografi",
  photoEn: "ci-test-photo",
  districtArchivePhoto: "ci-test-ilce-arsiv-fotografi",
  page: "ci-test-sayfasi",
});

/**
 * The public paths the fixtures make reachable. The a11y check visits them
 * in fixture mode (`A11Y_FIXTURES=1`) and fails when one is missing.
 */
export const fixturePaths = Object.freeze([
  `/makaleler/${fixtureSlugs.articleTr}`,
  `/en/articles/${fixtureSlugs.articleEn}`,
  `/kitaplar/${fixtureSlugs.bookTr}`,
  `/en/books/${fixtureSlugs.bookEn}`,
  `/fotograflar/${fixtureSlugs.photoTr}`,
  `/en/photography/${fixtureSlugs.photoEn}`,
  `/${fixtureSlugs.page}`,
  `/istanbul/ilceler/${FIXTURE_DISTRICT}`,
  `/istanbul/ilceler/${FIXTURE_DISTRICT}/haberler`,
]);

/** The fixture image: a flat colour generated at seed time, no licence. */
export const fixtureImage = Object.freeze({
  filename: "ci-test-gorseli.png",
  width: 1600,
  height: 900,
  // Dark teal: white text never sits on it, so contrast is not at stake.
  background: { r: 31, g: 78, b: 82 },
  alt: "CI test görseli: düz renkli bir dikdörtgen",
  description: `${FIXTURE_MARK}: seed betiğinin ürettiği düz renkli görsel`,
  sourceCopyright: `${FIXTURE_MARK} · tek renkli üretilmiş görsel, telif yok`,
});

import type {
  Book,
  DistrictGuide,
  Navigation,
  Page,
} from "../../src/payload-types";

/** A Lexical node as the generated rich-text types accept it. */
type LexicalNode = { [k: string]: unknown; type: string; version: number };

export function lexicalText(value: string, format = 0): LexicalNode {
  return {
    type: "text",
    text: value,
    format,
    detail: 0,
    mode: "normal",
    style: "",
    version: 1,
  };
}

function element(type: string, children: LexicalNode[], extra = {}) {
  return {
    type,
    children,
    direction: "ltr" as const,
    format: "" as const,
    indent: 0,
    version: 1,
    ...extra,
  };
}

export function lexicalParagraph(...children: LexicalNode[]): LexicalNode {
  return element("paragraph", children, { textFormat: 0, textStyle: "" });
}

export function lexicalHeading(tag: "h2" | "h3", value: string): LexicalNode {
  return element("heading", [lexicalText(value)], { tag });
}

export function lexicalList(items: string[]): LexicalNode {
  return element(
    "list",
    items.map((item, index) =>
      element("listitem", [lexicalText(item)], { value: index + 1 }),
    ),
    { listType: "bullet", start: 1, tag: "ul" },
  );
}

export function lexicalLink(url: string, label: string): LexicalNode {
  return element("link", [lexicalText(label)], {
    version: 3,
    fields: { linkType: "custom", newTab: false, url },
  });
}

export function lexicalUpload(mediaId: string): LexicalNode {
  return {
    type: "upload",
    relationTo: "media",
    value: mediaId,
    fields: null,
    format: "",
    id: "ci-fixture-upload",
    version: 3,
  };
}

export function lexicalDocument(...children: LexicalNode[]) {
  return { root: element("root", children) };
}

/** Body of the article fixture: headings, a list, a link and an image. */
export function articleBody(language: "tr" | "en", mediaId: string) {
  const tr = language === "tr";
  return lexicalDocument(
    lexicalParagraph(
      lexicalText(
        tr
          ? `${FIXTURE_MARK}. Bu metin yalnız sürekli entegrasyon ortamında, makale şablonunun erişilebilirlik ve yerleşim kontrolleri için oluşturulur; gerçek bir yazı değildir.`
          : `${FIXTURE_MARK_EN}. This text exists only in continuous integration, for the accessibility and layout checks of the article template; it is not a real article.`,
      ),
    ),
    lexicalHeading("h2", tr ? "Şablonun bölümleri" : "Template sections"),
    lexicalList(
      tr
        ? ["Başlık hiyerarşisi", "Liste öğeleri", "Kredili görsel"]
        : ["Heading hierarchy", "List items", "Credited image"],
    ),
    lexicalHeading("h3", tr ? "Bağlantı ve görsel" : "Link and image"),
    lexicalParagraph(
      lexicalText(tr ? "Site içi bir bağlantı: " : "An internal link: "),
      lexicalLink(
        tr ? "/makaleler" : "/en/articles",
        tr ? "makale listesi" : "article list",
      ),
      lexicalText("."),
    ),
    lexicalUpload(mediaId),
  );
}

/** Short body for the rich-text blocks of the page fixture. */
export function pageBlockBody(text: string) {
  return lexicalDocument(lexicalParagraph(lexicalText(text)));
}

/** Layout of the page fixture: every block a standard page renders. */
export function pageLayout(mediaId: string): NonNullable<Page["layout"]> {
  return [
    {
      blockType: "hero",
      visible: true,
      eyebrow: FIXTURE_MARK,
      titleLines: [
        { text: "CI test sayfası", accent: false },
        { text: "blok şablonları", accent: true },
      ],
      description:
        "Standart sayfa bloklarının sürekli entegrasyonda denetlenmesi için oluşturulan kurgusal kayıt.",
      primaryAction: { label: "Makaleler", href: "/makaleler" },
      secondaryAction: { label: "İletişim", href: "/iletisim" },
      highlights: [
        { value: "5", label: "blok türü" },
        { value: "1", label: "test görseli" },
      ],
    },
    {
      blockType: "richText",
      visible: true,
      eyebrow: FIXTURE_MARK,
      title: "Metin bloğu",
      content: pageBlockBody(
        "Zengin metin bloğu: paragraf ve başlık hiyerarşisi bu kayıtla denetlenir.",
      ),
    },
    {
      blockType: "cardGroup",
      visible: true,
      eyebrow: FIXTURE_MARK,
      title: "Kart grubu",
      cards: [
        {
          icon: "book",
          title: "Görselli kart",
          description: "Görseli ve bağlantısı olan bir kart.",
          image: mediaId,
          imageAlt: fixtureImage.alt,
          link: { label: "Kitaplar", href: "/kitaplar" },
        },
        {
          icon: "city",
          title: "Görselsiz kart",
          description: "Yalnız simgesi ve metni olan bir kart.",
          link: { label: "İlçeler", href: "/istanbul/ilceler" },
        },
      ],
    },
    {
      blockType: "imageText",
      visible: true,
      eyebrow: FIXTURE_MARK,
      title: "Görsel ve metin",
      content: pageBlockBody(
        "Görsel-metin bloğu: görselin kredisi ve alternatif metni bu kayıtla denetlenir.",
      ),
      image: mediaId,
      imageAlt: fixtureImage.alt,
      imagePosition: "left",
    },
    {
      blockType: "cta",
      visible: true,
      title: "Çağrı bloğu",
      description: "Bağlantılı çağrı bloğunun kurgusal örneği.",
      action: { label: "İletişime geçin", href: "/iletisim" },
    },
  ];
}

/** Book review fields shared by the TR and EN fixtures. */
export function bookReviewFields(language: "tr" | "en") {
  // `satisfies` keeps the literal types and checks every field name against
  // the generated Book type, so a renamed field fails the typecheck.
  const tr = language === "tr";
  return {
    title: tr
      ? `${FIXTURE_MARK}: kitap incelemesi`
      : `${FIXTURE_MARK_EN}: book review`,
    slug: tr ? fixtureSlugs.bookTr : fixtureSlugs.bookEn,
    language,
    authors: [{ name: "CI Test Yazarı", slug: "ci-test-yazari" }],
    category: "other",
    readingStatus: "completed",
    reviewStatus: "published",
    summary: tr
      ? "Kitap inceleme şablonunun sürekli entegrasyonda denetlenmesi için oluşturulan kurgusal özet."
      : "A fictional summary that exists only to check the book review template in continuous integration.",
    keyIdeas: [
      {
        title: tr ? "Birinci fikir" : "First idea",
        description: tr
          ? "Ana fikir kartının kurgusal açıklaması."
          : "Fictional description of a key idea card.",
        order: 1,
      },
    ],
    applicationNotes: [
      {
        title: tr ? "Uygulama notu" : "Application note",
        description: tr
          ? "Uygulama notunun kurgusal açıklaması."
          : "Fictional description of an application note.",
        action: tr ? "Kurgusal bir eylem." : "A fictional action.",
        order: 1,
      },
    ],
    quotes: [
      {
        text: tr ? "Kurgusal bir alıntı satırı." : "A fictional quote line.",
        note: tr ? "Alıntı notu." : "Quote note.",
        order: 1,
      },
    ],
    personalEvaluation: tr
      ? "Kişisel değerlendirme bölümünün kurgusal metni."
      : "Fictional text of the personal evaluation section.",
    rating: 4,
    seo: {
      title: tr ? "CI test kitap incelemesi" : "CI test book review",
      description: tr
        ? "Kitap inceleme şablonunun CI denetimi için kurgusal kayıt."
        : "Fictional record for the CI check of the book review template.",
      index: true,
      follow: true,
    },
  } satisfies Partial<Book>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** An ISO date `days` before `now`: fixture dates never pose as real ones. */
function daysBefore(now: number, days: number): string {
  return new Date(now - days * DAY_MS).toISOString();
}

/**
 * Texts the a11y run requires on the filled district guide and in the CMS
 * header and footer (`fixtureRoutes` in scripts/a11y/a11y-expectations.mjs),
 * so an empty guide or the static navigation can never pass for the
 * fixture. A test checks that the fixtures below carry each of them.
 */
export const fixtureGuideMarks = Object.freeze({
  summary: `${FIXTURE_MARK}: ilçe rehberi genel bakış metni`,
  neighbourhood: "CI test mahallesi A",
  planning: `${FIXTURE_MARK}: tamamlanmış imar satırı`,
  source: `${FIXTURE_MARK}: kurgusal resmî kaynak`,
});

export const fixtureNavigationMarks = Object.freeze({
  header: "CI test menüsü",
  footer: "CI test bağlantıları",
});

/** Fictional sources: `example.*` hosts, dates relative to the seed. */
export const fixtureGuideSourceUrls = Object.freeze({
  official: "https://www.example.gov.tr/ci-test-kaynagi",
  secondary: "https://example.org/ci-test-ikincil-kaynak",
});

const guideSections = [
  "summary",
  "history",
  "geography",
  "life",
  "transportation",
  "facts",
  "neighborhoods",
  "housingTexture",
  "regionalAssessment",
  "planningDevelopments",
  "placesGuide",
  "distinctiveFeatures",
  "researchTopics",
] as const;

const guideText = (subject: string) =>
  `${FIXTURE_MARK}: ${subject}. Bu paragraf yalnız sürekli entegrasyonda ilçe rehberi şablonunun yerleşim ve erişilebilirlik denetimi için yazıldı; ilçe hakkında bilgi vermez.\n\nİkinci paragraf, paragraf aralığının ve okuma sütunu genişliğinin denetlenmesi içindir.`;

/**
 * The published district guide fixture: every public section filled and
 * backed by a fictional, dated and checked source, so the content policy
 * publishes it and the guide renders the fact table, source references,
 * line chips, the neighbourhood list and a planning row. Market data is
 * left out on purpose: prices are the figure a screenshot could most easily
 * pass on as a fact.
 */
export function districtGuideFields(now: number) {
  const dataDate = daysBefore(now, 30);
  const checkedAt = daysBefore(now, 2);
  return {
    district: FIXTURE_DISTRICT,
    summary: `${fixtureGuideMarks.summary}. Rehberin dolu hâli yalnız bu test kaydıyla denetlenir.`,
    history: guideText("tarihçe bölümü"),
    geography: guideText("konum ve kentsel yapı bölümü"),
    life: guideText("gündelik yaşam bölümü"),
    // Line codes only to render the line chips; the text says so.
    transportation: `${FIXTURE_MARK}: ulaşım bölümü. Hat çipi bileşenini denetlemek için yalnız örnek kod olarak M1B ve T1 yazıldı; ilçenin ulaşımı hakkında bilgi vermez.`,
    facts: {
      neighborhoodCount: 2,
      neighboringDistricts: `${FIXTURE_MARK}: kurgusal komşu ilçe satırı`,
      locationSummary: `${FIXTURE_MARK}: konum özeti`,
    },
    neighborhoods: [
      {
        name: fixtureGuideMarks.neighbourhood,
        featured: true,
        description: `${FIXTURE_MARK}: öne çıkan kurgusal mahalle satırı`,
      },
      {
        name: "CI test mahallesi B",
        featured: false,
        description: `${FIXTURE_MARK}: ikinci kurgusal mahalle satırı`,
      },
    ],
    housingTexture: guideText("konut ve yapı dokusu bölümü"),
    regionalAssessment: guideText("bölgesel değerlendirme bölümü"),
    planningDevelopments: [
      {
        title: fixtureGuideMarks.planning,
        summary: `${FIXTURE_MARK}: imar satırı şablonunun kurgusal özeti.`,
        neighborhood: fixtureGuideMarks.neighbourhood,
        date: dataDate,
        status: "tamamlandi" as const,
        officialSource: fixtureGuideSourceUrls.official,
        checkedAt,
        needsVerification: false,
      },
    ],
    placesGuide: guideText("görülecek ve fotoğraflanacak yerler bölümü"),
    distinctiveFeatures: guideText("ilçeyi özel kılanlar bölümü"),
    researchTopics: guideText("ileri araştırma konuları bölümü"),
    reviewedSections: [...guideSections],
    sources: [
      {
        title: fixtureGuideMarks.source,
        publisher: "CI test yayıncısı (kurgusal)",
        url: fixtureGuideSourceUrls.official,
        sourceType: "official" as const,
        primary: true,
        dataDate,
        checkedAt,
        needsVerification: false,
        sections: [...guideSections],
      },
      {
        title: `${FIXTURE_MARK}: kurgusal ikincil kaynak`,
        publisher: "CI test yayıncısı (kurgusal)",
        url: fixtureGuideSourceUrls.secondary,
        sourceType: "secondary" as const,
        primary: false,
        dataDate,
        checkedAt,
        needsVerification: false,
        sections: ["history" as const, "life" as const, "placesGuide" as const],
      },
    ],
    researchNotes: `${FIXTURE_MARK}: public dışı araştırma notu; sayfada görünmemeli.`,
    publishedAt: daysBefore(now, 1),
    _status: "published" as const,
  } satisfies Partial<DistrictGuide>;
}

/**
 * The published Navigation global fixture: CMS labels for the header's
 * about and contact items, and TR and EN footer groups with a CMS page, an
 * internal and an external link. The site adds the required KVKK and
 * contact footer links (src/content/navigation/navigation-fallback.ts).
 */
export function navigationFields(pageId: string) {
  return {
    // The Turkish header keeps its fixed shortcuts and takes only the
    // about and contact labels from the CMS (withTurkishHeaderShortcuts in
    // src/content/navigation/static-navigation.ts), so those are the two
    // items whose CMS labels can reach the rendered header.
    headerItems: [
      {
        label: fixtureNavigationMarks.header,
        linkType: "internal" as const,
        internalPath: "/hakkimda",
      },
      {
        label: "CI test iletişim",
        linkType: "internal" as const,
        internalPath: "/iletisim",
      },
    ],
    footerGroups: [
      {
        title: fixtureNavigationMarks.footer,
        links: [
          {
            label: "CI test sayfası",
            linkType: "page" as const,
            page: pageId,
          },
          {
            label: "CI test dış bağlantısı",
            linkType: "external" as const,
            externalUrl: "https://example.org/ci-test",
            newTab: true,
          },
        ],
      },
    ],
    enFooter: [
      {
        title: "CI test links",
        links: [
          {
            label: "CI test articles",
            linkType: "internal" as const,
            internalPath: "/en/articles",
          },
        ],
      },
    ],
    _status: "published" as const,
  } satisfies Partial<Navigation>;
}

/** Why the district guide fixture could pass for district content, if so. */
export function districtGuideFixtureProblems(now = Date.now()): string[] {
  const problems: string[] = [];
  const guide = districtGuideFields(now);
  const texts: Array<[string, string]> = [
    ...(
      [
        "summary",
        "history",
        "geography",
        "life",
        "transportation",
        "housingTexture",
        "regionalAssessment",
        "placesGuide",
        "distinctiveFeatures",
        "researchTopics",
      ] as const
    ).map((key): [string, string] => [key, guide[key]]),
    ["facts.neighboringDistricts", guide.facts.neighboringDistricts],
    ["facts.locationSummary", guide.facts.locationSummary],
    ...guide.planningDevelopments.map((row): [string, string] => [
      "planning row",
      row.title,
    ]),
  ];
  for (const [key, value] of texts)
    if (!value.includes(FIXTURE_MARK))
      problems.push(`district guide ${key} lacks the fixture mark`);
  for (const row of guide.neighborhoods)
    if (!row.name.startsWith("CI test "))
      problems.push(`neighbourhood row is not a CI test name: ${row.name}`);
  for (const source of guide.sources) {
    if (!/^https:\/\/(www\.)?example\.(gov\.tr|org)\//.test(source.url))
      problems.push(`guide source is not an example address: ${source.url}`);
    if (!source.publisher.includes("kurgusal"))
      problems.push(`guide source publisher is not fictional: ${source.url}`);
  }
  // The only figure is the count of the guide's own fictional rows.
  const facts: Record<string, unknown> = guide.facts;
  for (const key of ["population", "populationYear", "areaKm2"])
    if (facts[key] !== undefined)
      problems.push(`district guide states a district figure: ${key}`);
  if (guide.facts.neighborhoodCount !== guide.neighborhoods.length)
    problems.push("neighbourhood count is not the count of its own rows");
  if ("marketData" in guide) problems.push("district guide states prices");
  return problems;
}

/**
 * Problems of a fixture set: every visible title carries the fixture mark
 * and every slug is a `ci-test-` slug, so no fixture can pose as content.
 */
export function fixtureProblems(): string[] {
  const problems: string[] = [];
  for (const [key, slug] of Object.entries(fixtureSlugs)) {
    if (!slug.startsWith("ci-test-"))
      problems.push(`${key} slug is not a ci-test- slug: ${slug}`);
  }
  for (const language of ["tr", "en"] as const) {
    const { title } = bookReviewFields(language);
    if (!title.includes(language === "tr" ? FIXTURE_MARK : FIXTURE_MARK_EN))
      problems.push(`book ${language} title lacks the fixture mark`);
  }
  if (!fixtureImage.sourceCopyright.includes(FIXTURE_MARK))
    problems.push("image credit lacks the fixture mark");
  problems.push(...districtGuideFixtureProblems());
  return problems;
}
