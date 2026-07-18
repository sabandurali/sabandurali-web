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
    contact: string;
    feedback: string;
  };
  menu: {
    openLabel: string;
    closeLabel: string;
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
  secondaryAction: string;
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
  imageAlt: string;
};

export type FocusAreaIcon = "book" | "city" | "network" | "handshake";

export type FocusAreasContent = {
  label: string;
  title: string;
  cards: ReadonlyArray<{
    icon: FocusAreaIcon;
    title: string;
    description: string;
    linkLabel: string;
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
        contact: "İletişim",
        feedback: "Beta geri bildirimi",
      },
      menu: {
        openLabel: "Menüyü aç",
        closeLabel: "Menüyü kapat",
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
          icon: "book",
          title: "Kitap İncelemeleri",
          description:
            "Okuduğum kitaplardan çıkardığım fikirler, eleştiriler ve uygulanabilir notlar.",
          linkLabel: "Yakında →",
        },
        {
          icon: "city",
          title: "İstanbul Analizleri",
          description:
            "İlçe, mahalle, ulaşım, dönüşüm ve gayrimenkul piyasası üzerine araştırmalar.",
          linkLabel: "Yakında →",
        },
        {
          icon: "network",
          title: "Yapay Zekâ",
          description:
            "Yapay zekâ araçları, iş modelleri ve günlük hayatta uygulanabilir kullanım rehberleri.",
          linkLabel: "Yakında →",
        },
        {
          icon: "handshake",
          title: "Satış ve Müzakere",
          description:
            "Güven oluşturma, ikna, müşteri yönetimi ve profesyonel müzakere sistemleri.",
          linkLabel: "Yakında →",
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
        work: "Work",
        contact: "Contact",
        feedback: "Beta feedback",
      },
      menu: {
        openLabel: "Open menu",
        closeLabel: "Close menu",
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
          icon: "book",
          title: "Book Reviews",
          description:
            "Practical notes, ideas and critical insights drawn from the books I read.",
          linkLabel: "Coming soon →",
        },
        {
          icon: "city",
          title: "Istanbul Research",
          description:
            "Research on districts, neighborhoods, transport, urban transformation and the real estate market.",
          linkLabel: "Coming soon →",
        },
        {
          icon: "network",
          title: "Artificial Intelligence",
          description:
            "Practical guides to AI tools, business models and everyday applications.",
          linkLabel: "Coming soon →",
        },
        {
          icon: "handshake",
          title: "Sales and Negotiation",
          description:
            "Systems for building trust, persuasion, client management and professional negotiation.",
          linkLabel: "Coming soon →",
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
