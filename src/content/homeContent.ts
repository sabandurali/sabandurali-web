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
    feedback: string;
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
  betaInvitation: {
    label: string;
    description: string;
    linkLabel: string;
    href: string;
  };
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

export type FocusAreaIcon = "book" | "city" | "network" | "handshake";

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
    feedback: string;
    privacy: string;
    email: string;
  };
};

export type HomeContent = {
  locale: Locale;
  anchors: HomeAnchors;
  header: HeaderContent;
  hero: HeroContent;
  about: AboutContent;
  focusAreas: FocusAreasContent;
  sectionOrder?: ReadonlyArray<"hero" | "about" | "focusAreas">;
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
        work: "Çalışmalar",
        articles: "Makaleler",
        books: "Kitaplar",
        photography: "Fotoğraflar",
        contact: "İletişim",
        feedback: "Beta geri bildirimi",
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
      eyebrow: "Gayrimenkul • Danışmanlık • Araştırma • Teknoloji",
      titleLines: [
        { text: "Bilgiyi araştıran," },
        { text: "analiz eden ve" },
        { text: "değer üreten", accent: true },
        { text: "bir platform." },
      ],
      description:
        "Gayrimenkul, danışmanlık, araştırma ve teknoloji alanlarında güvenilir bilgi, uygulanabilir analiz ve sürdürülebilir değer üreten bağımsız bir platform oluşturuyorum.",
      primaryAction: "Çalışmaları keşfet",
      secondaryAction: "Hakkımda",
      betaInvitation: {
        label: "🧪 Beta sürümü",
        description:
          "Bu platformu geliştirmeme yardımcı olmak için 3–4 dakikanızı ayırabilirsiniz.",
        linkLabel: "Beta geri bildirimi",
        href: "/geri-bildirim",
      },
      goalsLabel: "Platform hedefi",
      goals: [
        { value: "500+", label: "kitap incelemesi" },
        { value: "1.000+", label: "makale ve analiz" },
        { value: "2 dil", label: "Türkçe ve İngilizce" },
      ],
    },
    about: {
      label: "Hakkımda",
      titleLines: ["Şaban Durali"],
      paragraphs: [
        "Gayrimenkul, teknoloji, marka, programlama ve yaşam boyu öğrenme alanlarında çalışıyorum. Bu platformu yalnızca içerik yayımlamak için değil; araştırma yapmak, öğrendiklerimi uygulamak ve sürdürülebilir bilgi üretmek için kuruyorum.",
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
          title: "Gayrimenkul",
          description:
            "İstanbul gayrimenkul piyasası, değerleme, yatırım ve saha deneyimine dayalı içerikler.",
          linkLabel: "Makaleleri incele →",
          linkHref: "/makaleler",
        },
        {
          icon: "handshake",
          title: "Danışmanlık",
          description:
            "İhtiyaca, veriye ve güvene dayalı çözüm odaklı danışmanlık yaklaşımı.",
          linkLabel: "İletişime geç →",
          linkHref: "/iletisim",
        },
        {
          icon: "network",
          title: "Araştırma",
          description:
            "Karmaşık konuları güvenilir kaynaklarla inceleyen, karşılaştıran ve sadeleştiren çalışmalar.",
          linkLabel: "Makaleleri incele →",
          linkHref: "/makaleler",
        },
        {
          icon: "network",
          title: "Teknoloji ve Yapay Zekâ",
          description:
            "Teknoloji ve yapay zekânın iş, öğrenme ve günlük yaşamda bilinçli kullanımı.",
          linkLabel: "Makaleleri incele →",
          linkHref: "/makaleler",
        },
        {
          icon: "book",
          title: "Kitaplar ve Öğrenme",
          description:
            "Kitap incelemeleri ve öğrenmeyi güçlendiren fikirler.",
          linkLabel: "Kitapları incele →",
          linkHref: "/kitaplar",
        },
      ],
    },
    footer: {
      locale: "tr",
      brandName: "ŞABAN DURALİ",
      brandTagline: "ARAŞTIRMA VE BİLGİ PLATFORMU",
      description:
        "Gayrimenkul, danışmanlık, araştırma ve teknoloji odaklı bağımsız bilgi ve yayın platformu.",
      copyright: "© 2026 Şaban Durali. Tüm hakları saklıdır.",
      links: {
        contact: "İletişim",
        feedback: "Beta geri bildirimi",
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
        feedback: "Beta feedback",
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
      betaInvitation: {
        label: "🧪 Beta",
        description:
          "Help improve this platform by sharing your thoughts in just 3–4 minutes.",
        linkLabel: "Beta feedback",
        href: "/en/feedback",
      },
      goalsLabel: "Platform goals",
      goals: [
        { value: "500+", label: "book reviews" },
        { value: "1,000+", label: "articles and analyses" },
        { value: "2 languages", label: "Turkish and English" },
      ],
    },
    about: {
      label: "ABOUT",
      titleLines: ["Şaban", "Durali"],
      paragraphs: [
        "I work across real estate, technology, branding, programming and lifelong learning. I am building this platform not merely to publish content, but to conduct research, apply what I learn and produce sustainable knowledge.",
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
          title: "Real Estate",
          description:
            "Content shaped by Istanbul market research, valuation, investment, and field experience.",
          linkLabel: "Explore articles →",
          linkHref: "/en/articles",
        },
        {
          icon: "handshake",
          title: "Consulting",
          description:
            "A practical consulting approach grounded in needs, evidence, and trust.",
          linkLabel: "Get in touch →",
          linkHref: "/en/contact",
        },
        {
          icon: "network",
          title: "Research",
          description:
            "Research that examines, compares, and clarifies complex subjects using reliable sources.",
          linkLabel: "Explore articles →",
          linkHref: "/en/articles",
        },
        {
          icon: "network",
          title: "Technology and Artificial Intelligence",
          description:
            "Thoughtful use of technology and artificial intelligence in work, learning, and everyday life.",
          linkLabel: "Explore articles →",
          linkHref: "/en/articles",
        },
        {
          icon: "book",
          title: "Books and Learning",
          description:
            "Book reviews and ideas that strengthen lifelong learning.",
          linkLabel: "Explore books →",
          linkHref: "/en/books",
        },
      ],
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
        feedback: "Beta feedback",
        privacy: "Privacy Notice",
        email: "Email",
      },
    },
    backToTopLabel: "Back to top",
  },
} satisfies Record<Locale, HomeContent>;
