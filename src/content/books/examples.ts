import type {
  BookAuthor,
  BookReview,
  BookTag,
} from "@/content/books/types";

const scottYoung = {
  id: "book-author-scott-h-young",
  name: "Scott H. Young",
  slug: "scott-h-young",
} as const satisfies BookAuthor;

export const exampleBookTags = [
  {
    id: "book-tag-ultralearning",
    slug: "ultralearning",
    labelTr: "Aşkın Öğrenme",
    labelEn: "Ultralearning",
    aliases: ["Aşkın öğrenme", "Ultra learning"],
  },
  {
    id: "book-tag-self-directed-learning",
    slug: "self-directed-learning",
    labelTr: "Öz Yönetimli Öğrenme",
    labelEn: "Self-Directed Learning",
    aliases: ["Kendi kendine öğrenme", "Self directed learning"],
  },
] as const satisfies ReadonlyArray<BookTag>;

export const exampleTurkishBookReview = {
  id: "book-review-ultralearning-tr",
  title: "Aşkın Öğrenme",
  slug: "askin-ogrenme",
  language: "tr",
  translationGroupId: "book-translation-ultralearning",
  translationStatus: "completed",
  originalTitle: "Ultralearning",
  authors: [scottYoung],
  translator: null,
  publisher: null,
  originalPublisher: null,
  publicationYear: null,
  originalPublicationYear: null,
  edition: null,
  isbn10: null,
  isbn13: null,
  pageCount: null,
  coverImage: {
    src: "/books/askin-ogrenme-cover-placeholder.jpg",
    alt: "Aşkın Öğrenme kitap incelemesi için yerel placeholder kapak",
    caption: "Aşkın Öğrenme incelemesi placeholder kapağı",
    source: "Yerel prototip placeholder",
    copyrightOwner: "Şaban Durali",
    license: "Yalnızca prototip kullanımı",
    width: 1200,
    height: 1800,
  },
  category: "learning_and_education",
  tags: exampleBookTags,
  readingStatus: "completed",
  reviewStatus: "published",
  startedAt: "2026-06-01T09:00:00+03:00",
  completedAt: "2026-06-20T18:00:00+03:00",
  summary:
    "Zor becerileri kısa sürede edinmek için araştırma, doğrudan pratik, hatırlama ve hızlı geri bildirim üzerine kurulu yoğun bir öğrenme yaklaşımını inceler.",
  keyIdeas: [
    {
      id: "key-idea-metalearning-tr",
      title: "Önce öğrenme haritasını çıkarın",
      description:
        "Konuya başlamadan önce hangi kavramların, becerilerin ve yöntemlerin belirleyici olduğunu araştırın.",
      order: 1,
    },
    {
      id: "key-idea-directness-tr",
      title: "Gerçek göreve doğrudan yaklaşın",
      description:
        "Öğrenme etkinliğini, becerinin kullanılacağı gerçek bağlama mümkün olduğunca yaklaştırın.",
      order: 2,
    },
    {
      id: "key-idea-feedback-tr",
      title: "Geri bildirim döngüsünü kısaltın",
      description:
        "Hataları erken görünür kılan geri bildirimler sayesinde çalışma yöntemini hızlı biçimde düzeltin.",
      order: 3,
    },
  ],
  strengths: [
    "Öğrenmeyi uygulanabilir ilkeler etrafında düzenlemesi",
    "Doğrudan pratik ve geri bildirime güçlü vurgu yapması",
  ],
  weaknesses: [
    "Yoğun çalışma yaklaşımının her yaşam düzenine aynı ölçüde uymaması",
  ],
  whoShouldRead: [
    "Yeni ve zor bir beceriyi planlı biçimde öğrenmek isteyenler",
    "Kendi öğrenme sistemini gözden geçirmek isteyen profesyoneller",
  ],
  whoShouldNotRead: [
    "Yalnızca hızlı sonuç vaat eden kısa yollar arayanlar",
  ],
  applicationNotes: [
    {
      id: "application-learning-map-tr",
      title: "Bir haftalık öğrenme haritası hazırlayın",
      description:
        "Hedef becerinin alt bileşenlerini, güvenilir kaynakları ve değerlendirme ölçütlerini tek sayfada toplayın.",
      action: "Bir beceri seçip öğrenme haritasını 30 dakika içinde taslaklaştırın.",
      order: 1,
    },
    {
      id: "application-feedback-tr",
      title: "Günlük geri bildirim noktası kurun",
      description:
        "Her çalışma oturumunun sonunda hatayı ve bir sonraki düzeltmeyi kaydedin.",
      action: "Çalışma günlüğüne hata, neden ve sonraki adım alanlarını ekleyin.",
      order: 2,
    },
  ],
  personalEvaluation:
    "Kitap, öğrenmeyi soyut bir niyetten ölçülebilir bir projeye çevirmek için güçlü bir çerçeve sunuyor. Yaklaşımın en değerli yanı, pratik ve geri bildirimi merkeze almasıdır.",
  rating: 8.5,
  quotes: [
    {
      id: "quote-placeholder-tr",
      text: "Öğrenme, bilinçli ve doğrudan pratikle güçlenir.",
      note: "Modeli göstermek için temsili kısa ifade; kitaptan doğrulanmış birebir alıntı değildir.",
      order: 1,
    },
  ],
  relatedBookIds: [],
  authorId: "author-saban-durali",
  editorId: null,
  featured: true,
  showOnHomepage: true,
  seo: {
    title: "Aşkın Öğrenme Kitap İncelemesi | Şaban Durali",
    description:
      "Aşkın Öğrenme incelemesi: yoğun öğrenme, doğrudan pratik, hatırlama ve geri bildirim ilkelerini uygulanabilir notlar ve kişisel değerlendirmeyle keşfedin.",
    index: true,
    follow: true,
    openGraphTitle: "Aşkın Öğrenme Kitap İncelemesi",
    openGraphDescription:
      "Yoğun ve öz yönetimli öğrenme yaklaşımının temel fikirleri ve uygulanabilir notları.",
  },
  createdAt: "2026-06-21T10:00:00+03:00",
  updatedAt: "2026-07-22T11:00:00+03:00",
  publishedAt: "2026-07-22T11:00:00+03:00",
} satisfies BookReview;

export const exampleEnglishBookReview = {
  ...exampleTurkishBookReview,
  id: "book-review-ultralearning-en",
  title: "Ultralearning Review",
  slug: "ultralearning-review",
  language: "en",
  translationStatus: "completed",
  translationSourceBookReviewId: exampleTurkishBookReview.id,
  translationSourceUpdatedAt: exampleTurkishBookReview.updatedAt,
  coverImage: {
    ...exampleTurkishBookReview.coverImage,
    alt: "Local placeholder cover for the Ultralearning book review",
    caption: "Ultralearning review placeholder cover",
  },
  summary:
    "A structured review of an intensive learning approach built around research, direct practice, retrieval and rapid feedback for acquiring difficult skills.",
  keyIdeas: [
    {
      id: "key-idea-metalearning-en",
      title: "Map the learning problem first",
      description:
        "Research the concepts, skills and methods that matter before beginning a demanding learning project.",
      order: 1,
    },
    {
      id: "key-idea-directness-en",
      title: "Practice the real task directly",
      description:
        "Keep learning activities as close as possible to the context in which the skill will be used.",
      order: 2,
    },
    {
      id: "key-idea-feedback-en",
      title: "Shorten the feedback loop",
      description:
        "Use feedback that exposes mistakes early so the learning method can be adjusted quickly.",
      order: 3,
    },
  ],
  strengths: [
    "Organizes learning around practical principles",
    "Places strong emphasis on direct practice and feedback",
  ],
  weaknesses: [
    "Its intensive approach may not fit every schedule equally well",
  ],
  whoShouldRead: [
    "People planning to learn a difficult new skill",
    "Professionals reviewing their personal learning system",
  ],
  whoShouldNotRead: [
    "Readers looking only for effortless shortcuts",
  ],
  applicationNotes: [
    {
      id: "application-learning-map-en",
      title: "Create a one-week learning map",
      description:
        "Collect the skill components, reliable resources and evaluation criteria on one page.",
      action: "Choose one skill and draft its learning map in thirty minutes.",
      order: 1,
    },
    {
      id: "application-feedback-en",
      title: "Add a daily feedback checkpoint",
      description:
        "Record the main mistake and the next correction after every practice session.",
      action: "Add mistake, cause and next-step fields to the learning journal.",
      order: 2,
    },
  ],
  personalEvaluation:
    "The book offers a strong framework for turning learning from an abstract intention into a measurable project. Its focus on practice and feedback is especially useful.",
  quotes: [
    {
      id: "quote-placeholder-en",
      text: "Learning grows stronger through deliberate and direct practice.",
      note: "Representative text for demonstrating the model; not a verified verbatim quotation from the book.",
      order: 1,
    },
  ],
  seo: {
    title: "Ultralearning Book Review | Şaban Durali",
    description:
      "Read an Ultralearning review covering intensive learning, direct practice, retrieval and feedback through practical notes and a personal evaluation.",
    index: true,
    follow: true,
    openGraphTitle: "Ultralearning Book Review",
    openGraphDescription:
      "Key ideas and practical notes from an intensive, self-directed learning approach.",
  },
} satisfies BookReview;
