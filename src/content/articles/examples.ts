import type { Article, ArticleTag } from "@/content/articles/types";

export const exampleArticleTags = [
  {
    id: "tag-artificial-intelligence",
    slug: "artificial-intelligence",
    labelTr: "Yapay Zekâ",
    labelEn: "Artificial Intelligence",
    aliases: ["Yapay Zeka", "AI"],
  },
  {
    id: "tag-real-estate-investment",
    slug: "real-estate-investment",
    labelTr: "Gayrimenkul Yatırımı",
    labelEn: "Real Estate Investment",
    aliases: ["Emlak yatırımı", "Property investment"],
  },
  {
    id: "tag-istanbul",
    slug: "istanbul",
    labelTr: "İstanbul",
    labelEn: "Istanbul",
    aliases: [],
  },
] as const satisfies ReadonlyArray<ArticleTag>;

const author = {
  id: "author-saban-durali",
  name: "Şaban Durali",
  role: "Yazar",
} as const;

export const exampleTurkishArticle = {
  id: "article-istanbul-real-estate-investment-tr",
  title:
    "İstanbul’da Gayrimenkul Yatırımı Yaparken Dikkat Edilmesi Gerekenler",
  slug: "istanbulda-gayrimenkul-yatirimi-yaparken-dikkat-edilmesi-gerekenler",
  language: "tr",
  translationGroupId: "translation-istanbul-real-estate-investment",
  translationStatus: "pending",
  summary:
    "İstanbul’da gayrimenkul yatırımı öncesinde konum, hukuki durum, maliyet ve uzun vadeli potansiyelin nasıl değerlendirilmesi gerektiğine dair temel bir rehber.",
  content: [
    {
      id: "block-introduction",
      type: "paragraph",
      text: "İstanbul gayrimenkul piyasası ilçeden ilçeye, hatta mahalleden mahalleye önemli farklılıklar gösterir. Sağlıklı bir yatırım kararı yalnızca satış fiyatına değil, birbiriyle ilişkili ölçütlere dayanmalıdır.",
    },
    {
      id: "block-location-heading",
      type: "heading",
      level: "h2",
      text: "Konumu verilerle değerlendirin",
    },
    {
      id: "block-location-list",
      type: "bullet_list",
      items: [
        "Toplu taşıma ve ana ulaşım bağlantıları",
        "Bölgedeki arz, talep ve boşluk oranları",
        "Planlanan altyapı ve dönüşüm projeleri",
      ],
    },
    {
      id: "block-legal-heading",
      type: "heading",
      level: "h2",
      text: "Hukuki ve teknik kontrolleri tamamlayın",
    },
    {
      id: "block-legal-warning",
      type: "warning_box",
      title: "Belge kontrolü",
      text: "Tapu kaydı, imar durumu ve yapı kullanım belgeleri uzman desteğiyle doğrulanmadan bağlayıcı karar vermeyin.",
    },
  ],
  coverImage: {
    src: "/articles/istanbul-real-estate-investment-cover.jpg",
    alt: "İstanbul silüeti ve konut yapılarını gösteren temsili kapak görseli",
    caption: "İstanbul gayrimenkul yatırımı rehberi",
    source: "Örnek medya arşivi",
    copyrightOwner: "Şaban Durali",
    license: "Tüm hakları saklıdır",
    width: 1600,
    height: 900,
  },
  category: "real_estate",
  tags: [exampleArticleTags[1], exampleArticleTags[2]],
  author,
  editor: null,
  reviewer: null,
  status: "published",
  visibility: "public",
  publishedAt: "2026-07-22T09:00:00+03:00",
  scheduledAt: null,
  createdAt: "2026-07-15T10:00:00+03:00",
  updatedAt: "2026-07-22T09:00:00+03:00",
  lastVerifiedAt: "2026-07-22T09:00:00+03:00",
  nextReviewAt: "2027-01-22T09:00:00+03:00",
  freshnessStatus: "current",
  featured: true,
  showOnHomepage: true,
  seo: {
    title: "İstanbul’da Gayrimenkul Yatırımı Rehberi | Şaban Durali",
    description:
      "İstanbul’da gayrimenkul yatırımı yaparken konum, hukuki durum, toplam maliyet ve uzun vadeli değer potansiyelini doğru değerlendirme rehberi.",
    canonical:
      "https://sabandurali.com/makaleler/istanbulda-gayrimenkul-yatirimi-yaparken-dikkat-edilmesi-gerekenler",
    index: true,
    follow: true,
    openGraphTitle: "İstanbul’da Gayrimenkul Yatırımı Yaparken Dikkat Edilecekler",
    openGraphDescription:
      "İstanbul gayrimenkul piyasasında bilinçli yatırım kararları için temel kontrol noktaları.",
    openGraphImage: "/articles/istanbul-real-estate-investment-og.jpg",
  },
  sources: [
    {
      id: "source-land-registry-guide",
      title: "Gayrimenkul Alım Süreci Bilgilendirme Rehberi",
      authorOrInstitution: "Örnek Resmî Kurum",
      url: "https://example.com/gayrimenkul-alim-rehberi",
      publishedAt: "2026-01-10",
      accessedAt: "2026-07-20",
      sourceType: "official_institution",
      note: "Hukuki kontrol adımları için örnek kaynak.",
    },
  ],
  faq: [
    {
      id: "faq-location",
      question: "İstanbul’da yatırım için en önemli konum ölçütü nedir?",
      answer:
        "Tek bir ölçüt yeterli değildir; ulaşım, yerel talep, yapı stoku ve bölgesel planlar birlikte değerlendirilmelidir.",
      order: 1,
      visible: true,
    },
    {
      id: "faq-documents",
      question: "Satın almadan önce hangi belgeler kontrol edilmelidir?",
      answer:
        "Taşınmazın niteliğine göre tapu kaydı, imar durumu, yapı ruhsatı ve yapı kullanım izin belgesi kontrol edilmelidir.",
      order: 2,
      visible: true,
    },
  ],
  relatedArticles: [],
  legalNotice: {
    required: true,
    text: "Bu içerik genel bilgilendirme amaçlıdır; yatırım, hukuk veya vergi danışmanlığı değildir.",
  },
  versionHistory: [
    {
      version: 1,
      createdAt: "2026-07-22T09:00:00+03:00",
      createdBy: author,
      changeSummary: "İlk yayın sürümü oluşturuldu.",
    },
  ],
} satisfies Article;

export const exampleEnglishArticle = {
  ...exampleTurkishArticle,
  id: "article-istanbul-real-estate-investment-en",
  title: "What to Consider When Investing in Istanbul Real Estate",
  slug: "what-to-consider-when-investing-in-istanbul-real-estate",
  language: "en",
  translationStatus: "completed",
  translationSourceArticleId: exampleTurkishArticle.id,
  translationSourceUpdatedAt: exampleTurkishArticle.updatedAt,
  summary:
    "A practical guide to evaluating location, legal status, total cost and long-term potential before investing in Istanbul real estate.",
  content: [
    {
      id: "block-introduction-en",
      type: "paragraph",
      text: "Istanbul's property market varies significantly between districts and even neighborhoods. A sound decision should consider several connected factors, not only the purchase price.",
    },
    {
      id: "block-location-heading-en",
      type: "heading",
      level: "h2",
      text: "Evaluate the location with evidence",
    },
    {
      id: "block-location-list-en",
      type: "bullet_list",
      items: [
        "Public transport and major connections",
        "Local supply, demand and vacancy rates",
        "Planned infrastructure and regeneration projects",
      ],
    },
    {
      id: "block-legal-heading-en",
      type: "heading",
      level: "h2",
      text: "Complete the legal and technical checks",
    },
  ],
  coverImage: {
    ...exampleTurkishArticle.coverImage,
    alt: "Representative view of Istanbul's skyline and residential buildings",
    caption: "Istanbul real estate investment guide",
  },
  seo: {
    title: "Istanbul Real Estate Investment Guide | Şaban Durali",
    description:
      "Learn how to assess location, legal status, total ownership cost and long-term value before making a real estate investment decision in Istanbul.",
    canonical:
      "https://sabandurali.com/en/articles/what-to-consider-when-investing-in-istanbul-real-estate",
    index: true,
    follow: true,
    openGraphTitle: "What to Consider When Investing in Istanbul Real Estate",
    openGraphDescription:
      "Essential checks for making informed decisions in Istanbul's property market.",
    openGraphImage: "/articles/istanbul-real-estate-investment-og.jpg",
  },
  sources: [
    {
      ...exampleTurkishArticle.sources[0],
      title: "Property Purchase Process Information Guide",
      note: "Example source for legal due-diligence steps.",
    },
  ],
  faq: [],
  legalNotice: {
    required: true,
    text: "This content is for general information and is not investment, legal or tax advice.",
  },
  versionHistory: [
    {
      version: 1,
      createdAt: "2026-07-22T09:00:00+03:00",
      createdBy: author,
      changeSummary: "Initial English translation created.",
    },
  ],
} satisfies Article;
