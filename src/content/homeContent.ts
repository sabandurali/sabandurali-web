export type Locale = "tr" | "en";

export type HomeAnchors = {
  about: string;
  work: string;
  contact: string;
};

export type HeaderContent = {
  mobileBrandName: string;
  brandName: string;
  brandTagline: string;
  navigation: {
    about: string;
    work: string;
    articles: string;
    books?: string;
    photography: string;
    contact: string;
  };
  menu: {
    openLabel: string;
    closeLabel: string;
    desktopNavigationLabel: string;
    navigationLabel: string;
  };
  languageSwitcherLabel: string;
};

export type HeroContent = {
  eyebrow: string;
  titleLines: ReadonlyArray<{
    text: string;
    accent?: boolean;
  }>;
  description: string;
  primaryAction: string;
  primaryActionHref?: string;
  secondaryAction: string;
  secondaryActionHref?: string;
  goalsLabel: string;
  goals: ReadonlyArray<{
    value: string;
    label: string;
  }>;
};

export type AboutContent = {
  label: string;
  titleLines: ReadonlyArray<string>;
  paragraphs: ReadonlyArray<string>;
  linkLabel?: string;
  linkHref?: string;
  imageSrc?: string;
  imageAlt: string;
};

export type FocusAreaIcon =
  | "book"
  | "city"
  | "network"
  | "handshake"
  | "research"
  | "technology";

export type FocusAreasContent = {
  label: string;
  title: string;
  description?: string;
  cards: ReadonlyArray<{
    icon: FocusAreaIcon;
    title: string;
    description: string;
    linkLabel: string;
    linkHref?: string;
  }>;
};

export type FooterContent = {
  locale: Locale;
  brandName: string;
  brandTagline: string;
  description: string;
  copyright: string;
  links: {
    contact: string;
    privacy: string;
    email: string;
  };
};

export type HomeListingSectionContent = {
  title: string;
  linkLabel: string;
};

export type HomeContactCallToActionContent = {
  title: string;
  description: string;
  buttonLabel: string;
};

export type HomeContent = {
  locale: Locale;
  anchors: HomeAnchors;
  header: HeaderContent;
  hero: HeroContent;
  about: AboutContent;
  focusAreas: FocusAreasContent;
  listingSections: {
    articles: HomeListingSectionContent;
    books: HomeListingSectionContent;
    photography: HomeListingSectionContent;
  };
  contactCallToAction: HomeContactCallToActionContent;
  footer: FooterContent;
  backToTopLabel: string;
};

export const homeContent = {
  tr: {
    locale: "tr",
    anchors: {
      about: "hakkimda",
      work: "calismalar",
      contact: "iletisim",
    },
    header: {
      mobileBrandName: "Şaban Durali",
      brandName: "ŞABAN DURALİ",
      brandTagline: "ARAŞTIRMA VE BİLGİ PLATFORMU",
      navigation: {
        about: "Hakkımda",
        work: "Çalışma Alanları",
        articles: "Makaleler",
        books: "Kitaplar",
        photography: "Fotoğraflar",
        contact: "İletişim",
      },
      menu: {
        openLabel: "Menüyü aç",
        closeLabel: "Menüyü kapat",
        desktopNavigationLabel: "Ana navigasyon",
        navigationLabel: "Mobil navigasyon",
      },
      languageSwitcherLabel: "Dil seçimi",
    },
    hero: {
      eyebrow: "Gayrimenkul • İstanbul • Araştırma • Teknoloji",
      titleLines: [
        { text: "Bilgiyi araştıran," },
        { text: "analiz eden ve" },
        { text: "değer üreten", accent: true },
        { text: "bir platform." },
      ],
      description:
        "Gayrimenkul ve İstanbul, araştırma ve analiz, yapay zekâ ve teknoloji, kitaplar ve öğrenme ile fotoğraf alanlarında güvenilir bilgi ve uygulanabilir analiz üreten bağımsız bir platform oluşturuyorum.",
      primaryAction: "Çalışmaları keşfet",
      primaryActionHref: "/calisma-alanlari",
      secondaryAction: "Hakkımda",
      secondaryActionHref: "/hakkimda",
      goalsLabel: "Platform yapısı",
      goals: [
        { value: "5", label: "odak alanı" },
        { value: "2", label: "Türkçe ve İngilizce" },
        { value: "Bağımsız", label: "araştırma ve yayın platformu" },
      ],
    },
    about: {
      label: "Hakkımda",
      titleLines: ["Şaban Durali"],
      paragraphs: [
        "Gayrimenkul ve İstanbul, araştırma ve analiz, yapay zekâ ve teknoloji, kitaplar ve öğrenme ile fotoğraf alanlarında çalışıyorum. Bu platformu yalnızca içerik yayımlamak için değil; araştırmak, öğrendiklerimi uygulamak ve sürdürülebilir bilgi üretmek için kuruyorum.",
        "Uzun vadeli hedefim, yapay zekâ ve dijital sistemleri kullanarak eğitim, araştırma, danışmanlık ve bağımsız yayıncılık alanlarında değer üreten bir yapı oluşturmaktır.",
      ],
      imageAlt: "Şaban Durali portresi",
    },
    focusAreas: {
      label: "Ana çalışma alanları",
      title: "Birbirini besleyen bilgi ve uzmanlık alanları.",
      cards: [
        {
          icon: "city",
          title: "GAYRİMENKUL VE İSTANBUL",
          description:
            "İstanbul piyasası, değerleme, yatırım, mahalleler ve saha deneyimine dayalı rehberler.",
          linkLabel: "Çalışma alanını aç",
          linkHref: "/gayrimenkul-ve-istanbul",
        },
        {
          icon: "research",
          title: "ARAŞTIRMA VE ANALİZ",
          description:
            "Ekonomi, şehir ve toplumsal konuları güvenilir kaynaklarla karşılaştıran sade ve anlaşılır analizler.",
          linkLabel: "Çalışma alanını aç",
          linkHref: "/arastirma-ve-analiz",
        },
        {
          icon: "technology",
          title: "YAPAY ZEKÂ VE TEKNOLOJİ",
          description:
            "Yapay zekâ araçları, dijital üretim ve teknolojinin mesleki ve günlük kullanımına yönelik uygulamalı notlar.",
          linkLabel: "Çalışma alanını aç",
          linkHref: "/yapay-zeka-ve-teknoloji",
        },
        {
          icon: "book",
          title: "KİTAPLAR VE ÖĞRENME",
          description:
            "Kitap incelemeleri, öğrenme yöntemleri ve hayata uygulanabilecek temel fikirler.",
          linkLabel: "Çalışma alanını aç",
          linkHref: "/kitaplar-ve-ogrenme",
        },
        {
          icon: "network",
          title: "FOTOĞRAF",
          description:
            "İstanbul, mimari, sokak ve gündelik hayata dair fotoğraf arşivleri.",
          linkLabel: "Çalışma alanını aç",
          linkHref: "/fotograf",
        },
      ],
    },
    listingSections: {
      articles: {
        title: "Son Yazılar",
        linkLabel: "Tüm makaleler",
      },
      books: {
        title: "Kitaplar & Öğrenme",
        linkLabel: "Tüm kitaplar",
      },
      photography: {
        title: "Fotoğraf",
        linkLabel: "Tüm fotoğraflar",
      },
    },
    contactCallToAction: {
      title: "İletişime Geçin",
      description:
        "Gayrimenkul, araştırma, teknoloji, danışmanlık veya iş birliği hakkında iletişime geçebilirsiniz.",
      buttonLabel: "İletişime geç",
    },
    footer: {
      locale: "tr",
      brandName: "ŞABAN DURALİ",
      brandTagline: "ARAŞTIRMA VE BİLGİ PLATFORMU",
      description:
        "Gayrimenkul ve İstanbul, araştırma, teknoloji, öğrenme ve fotoğraf odaklı bağımsız bilgi ve yayın platformu.",
      copyright: "© 2026 Şaban Durali. Tüm hakları saklıdır.",
      links: {
        contact: "İletişim",
        privacy: "KVKK Aydınlatma Metni",
        email: "E-posta",
      },
    },
    backToTopLabel: "Sayfanın başına dön",
  },
  en: {
    locale: "en",
    anchors: {
      about: "about",
      work: "work",
      contact: "contact",
    },
    header: {
      mobileBrandName: "Şaban Durali",
      brandName: "ŞABAN DURALİ",
      brandTagline: "RESEARCH AND KNOWLEDGE PLATFORM",
      navigation: {
        about: "About",
        work: "Focus Areas",
        articles: "Articles",
        books: "Books",
        photography: "Photography",
        contact: "Contact",
      },
      menu: {
        openLabel: "Open menu",
        closeLabel: "Close menu",
        desktopNavigationLabel: "Primary navigation",
        navigationLabel: "Mobile navigation",
      },
      languageSwitcherLabel: "Language selection",
    },
    hero: {
      eyebrow: "REAL ESTATE • CONSULTING • RESEARCH • TECHNOLOGY",
      titleLines: [
        { text: "A platform that" },
        { text: "researches," },
        { text: "analyzes and" },
        { text: "creates value.", accent: true },
      ],
      description:
        "I am building an independent platform that produces reliable knowledge, actionable analysis and sustainable value across real estate, consulting, research and technology.",
      primaryAction: "Explore the work",
      secondaryAction: "About",
      goalsLabel: "Platform structure",
      goals: [
        { value: "5", label: "focus areas" },
        { value: "2", label: "Turkish and English" },
        { value: "Independent", label: "research and publishing platform" },
      ],
    },
    about: {
      label: "ABOUT",
      titleLines: ["Şaban", "Durali"],
      paragraphs: [
        "I work across real estate and Istanbul, research and analysis, artificial intelligence and technology, sales and negotiation, and lifelong learning. I am building this platform not merely to publish content, but to conduct research, apply what I learn and produce sustainable knowledge.",
        "My long-term goal is to use artificial intelligence and digital systems to build a sustainable platform that creates value across education, research, consulting and independent publishing.",
      ],
      imageAlt: "Portrait of Şaban Durali",
    },
    focusAreas: {
      label: "CORE AREAS",
      title: "Interconnected fields of knowledge and expertise.",
      cards: [
        {
          icon: "city",
          title: "REAL ESTATE AND ISTANBUL",
          description:
            "Guides grounded in Istanbul’s property market, valuation, investment, neighbourhoods and field experience.",
          linkLabel: "Explore real estate guides",
          linkHref: "/en/articles",
        },
        {
          icon: "research",
          title: "RESEARCH AND ANALYSIS",
          description:
            "Clear analysis of economic, urban and social topics based on reliable and comparative sources.",
          linkLabel: "Read the analyses",
          linkHref: "/en/articles",
        },
        {
          icon: "technology",
          title: "ARTIFICIAL INTELLIGENCE AND TECHNOLOGY",
          description:
            "Practical notes on AI tools, digital production and the professional and everyday use of technology.",
          linkLabel: "Explore technology notes",
          linkHref: "/en/articles",
        },
        {
          icon: "handshake",
          title: "SALES AND NEGOTIATION",
          description:
            "Applicable methods for building trust, managing clients, persuasion and ethical negotiation.",
          linkLabel: "Explore sales and negotiation",
          linkHref: "/en/articles",
        },
        {
          icon: "book",
          title: "BOOKS AND LEARNING",
          description:
            "Book reviews, learning methods and ideas that can be applied in everyday life.",
          linkLabel: "Browse book reviews",
          linkHref: "/en/books",
        },
      ],
    },
    listingSections: {
      articles: {
        title: "Latest Articles",
        linkLabel: "View all articles",
      },
      books: {
        title: "Books & Learning",
        linkLabel: "View all books",
      },
      photography: {
        title: "Photography",
        linkLabel: "View all photography",
      },
    },
    contactCallToAction: {
      title: "Get in Touch",
      description:
        "Get in touch about real estate, research, technology, consulting or collaboration.",
      buttonLabel: "Get in touch",
    },
    footer: {
      locale: "en",
      brandName: "ŞABAN DURALİ",
      brandTagline: "RESEARCH AND KNOWLEDGE PLATFORM",
      description:
        "An independent knowledge and publishing platform focused on real estate, consulting, research and technology.",
      copyright: "© 2026 Şaban Durali. All rights reserved.",
      links: {
        contact: "Contact",
        privacy: "Privacy Notice",
        email: "Email",
      },
    },
    backToTopLabel: "Back to top",
  },
} satisfies Record<Locale, HomeContent>;
