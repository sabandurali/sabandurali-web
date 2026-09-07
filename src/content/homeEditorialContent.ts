import type { FocusAreaIcon, Locale } from "@/content/homeContent";
import { districtGuidePath } from "@/content/districts/district-routes";

type EditorialLink = {
  href: string | null;
  label: string;
};

export type HomeEditorialContent = {
  heroIntelligence: {
    label: string;
    items: ReadonlyArray<readonly [value: string, label: string]>;
  };
  discovery: {
    eyebrow: string;
    titleLines: ReadonlyArray<string>;
    description: string;
    allDistricts: EditorialLink;
    europeanSide: string;
    asianSide: string;
    featuredLabel: string;
    guideLabel: string;
    guideAction: EditorialLink;
  };
  realEstate: {
    eyebrow: string;
    titleLines: ReadonlyArray<string>;
    explore: EditorialLink;
    items: ReadonlyArray<
      readonly [title: string, href: string | null, icon: FocusAreaIcon]
    >;
    plannedTools: ReadonlyArray<string>;
    viewLabel: string;
    comingSoonLabel: string;
  };
  researchEyebrow: string;
  knowledge: {
    eyebrow: string;
    titleLines: ReadonlyArray<string>;
    cards: ReadonlyArray<
      readonly [title: string, description: string, href: string, image: string]
    >;
    openLabel: string;
  };
  photographyEyebrow: string;
  manifestoLines: ReadonlyArray<string>;
};

export const homeEditorialContent = {
  tr: {
    heroIntelligence: {
      label: "İstanbul verileri",
      items: [
        ["39", "İlçe"],
        ["25", "Avrupa Yakası"],
        ["14", "Anadolu Yakası"],
        ["Bağımsız", "Yayın"],
      ],
    },
    discovery: {
      eyebrow: "01 / İstanbul’u Keşfet",
      titleLines: ["39 İlçe.", "Derinlemesine rehberler."],
      description:
        "İstanbul’un Avrupa ve Anadolu yakalarındaki 39 ilçesine dair doğrulanmış rehberler.",
      allDistricts: { href: districtGuidePath, label: "Tüm İlçeler" },
      europeanSide: "Avrupa Yakası",
      asianSide: "Anadolu Yakası",
      featuredLabel: "Öne çıkan ilçe rehberleri",
      guideLabel: "İlçe rehberi",
      guideAction: { href: districtGuidePath, label: "Detaylı Rehber" },
    },
    realEstate: {
      eyebrow: "02 / Gayrimenkul Intelligence",
      titleLines: ["Veriye dayalı kararlar.", "Daha doğru analiz."],
      explore: {
        href: "/gayrimenkul-ve-istanbul",
        label: "Alanı keşfet",
      },
      items: [
        [
          "Değerleme Analizleri",
          "/gayrimenkul-ve-istanbul/gayrimenkul-rehberleri",
          "network",
        ],
        [
          "Yatırım Analizleri",
          "/gayrimenkul-ve-istanbul/arastirmalar",
          "research",
        ],
        ["Kira & Getiri Analizleri", null, "network"],
        ["Mahalle Analizleri", districtGuidePath, "city"],
        [
          "İmar & Plan Bilgileri",
          "/gayrimenkul-ve-istanbul/sehir-ve-imar",
          "city",
        ],
        ["Piyasa Araştırmaları", "/arastirma-ve-analiz", "research"],
      ],
      plannedTools: ["Kira Çarpanı", "ROI", "İlçe Karşılaştır"],
      viewLabel: "İncele",
      comingSoonLabel: "Yakında",
    },
    researchEyebrow: "03 / Son Araştırmalar",
    knowledge: {
      eyebrow: "04 / Bilgi Kütüphanesi",
      titleLines: ["Öğren.", "Keşfet.", "Geliştir."],
      cards: [
        [
          "Araştırmalar & Analizler",
          "Piyasa, şehir ve teknoloji odağında kaynak temelli çalışmalar.",
          "/arastirma-ve-analiz",
          "/workspaces/arastirma-analiz.jpg",
        ],
        [
          "Kitaplar & Öğrenme",
          "Okuma notları, kitap incelemeleri ve sürekli öğrenme içerikleri.",
          "/kitaplar-ve-ogrenme",
          "/workspaces/kitaplar-ogrenme.jpg",
        ],
        [
          "Yapay Zekâ & Teknoloji",
          "Dijital dönüşüm, üretken yapay zekâ ve teknoloji notları.",
          "/yapay-zeka-ve-teknoloji",
          "/workspaces/yapay-zeka-teknoloji.jpg",
        ],
      ],
      openLabel: "Alanı aç",
    },
    photographyEyebrow: "05 / İstanbul’u Belgeliyorum",
    manifestoLines: [
      "Bilgi, paylaşıldığında büyür.",
      "Analiz, doğru sorularla başlar.",
      "Değer, tutarlılıkla oluşur.",
    ],
  },
  en: {
    heroIntelligence: {
      label: "Istanbul Data",
      items: [
        ["39", "Districts"],
        ["25", "European Side"],
        ["14", "Asian Side"],
        ["Independent", "Publishing"],
      ],
    },
    discovery: {
      eyebrow: "01 / Explore Istanbul",
      titleLines: ["39 Districts.", "In-depth guides."],
      description:
        "Verified guides to Istanbul’s 39 districts across the European and Asian sides.",
      allDistricts: { href: null, label: "All Districts" },
      europeanSide: "European Side",
      asianSide: "Asian Side",
      featuredLabel: "Featured District Guides",
      guideLabel: "District Guide",
      guideAction: { href: null, label: "Detailed Guide" },
    },
    realEstate: {
      eyebrow: "02 / Real Estate Intelligence",
      titleLines: ["Data-driven decisions.", "Better analysis."],
      explore: { href: "/en/articles", label: "Explore the Area" },
      items: [
        ["Valuation Analysis", "/en/articles", "network"],
        ["Investment Analysis", "/en/articles", "research"],
        ["Rent & Yield Analysis", null, "network"],
        ["Neighborhood Analysis", null, "city"],
        ["Zoning & Planning", "/en/articles", "city"],
        ["Market Research", "/en/articles", "research"],
      ],
      plannedTools: ["Rent Multiplier", "ROI", "Compare Districts"],
      viewLabel: "Explore",
      comingSoonLabel: "Coming Soon",
    },
    researchEyebrow: "03 / Latest Research",
    knowledge: {
      eyebrow: "04 / Knowledge Library",
      titleLines: ["Learn.", "Explore.", "Grow."],
      cards: [
        [
          "Research & Analysis",
          "Source-based work focused on markets, cities and technology.",
          "/en/articles",
          "/workspaces/arastirma-analiz.jpg",
        ],
        [
          "Books & Learning",
          "Reading notes, book reviews and lifelong learning resources.",
          "/en/books",
          "/workspaces/kitaplar-ogrenme.jpg",
        ],
        [
          "AI & Technology",
          "Notes on digital transformation, generative AI and technology.",
          "/en/articles",
          "/workspaces/yapay-zeka-teknoloji.jpg",
        ],
      ],
      openLabel: "Explore",
    },
    photographyEyebrow: "05 / Documenting Istanbul",
    manifestoLines: [
      "Knowledge grows when it is shared.",
      "Analysis begins with the right questions.",
      "Value is built through consistency.",
    ],
  },
} satisfies Record<Locale, HomeEditorialContent>;
