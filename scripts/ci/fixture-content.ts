// Representative, clearly fictional CMS records that the CI end-to-end
// checks render: one published article (TR and EN), one district news item,
// one book review (TR and EN), one photo (TR and EN) and one standard page
// with every non-home CMS block. They exist only in the CI SQLite database
// that `scripts/ci/seed-fixtures.ts` writes; nothing here is site content.
//
// Every visible text says it is a test fixture, so a screenshot or report can
// never be mistaken for a real article, review, photo or district fact.
// The module is pure (no Payload, no database), so node:test checks it.

/** Marker that every fixture title and credit carries. */
export const FIXTURE_MARK = "CI test kaydı";
export const FIXTURE_MARK_EN = "CI test record";

/** The district the news fixture is filed under (a registry slug). */
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

import type { Book, Page } from "../../src/payload-types";

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
  return problems;
}
