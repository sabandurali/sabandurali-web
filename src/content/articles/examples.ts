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
