import type { Locale } from "@/content/homeContent";

export type FeedbackContent = {
  locale: Locale;
  metadata: {
    title: string;
    description: string;
  };
  eyebrow: string;
  heading: string;
  description: string;
  unavailableMessage: string;
  dataProtectionNote: string;
  requiredLabel: string;
  optionalLabel: string;
  fields: {
    clarity: {
      legend: string;
      options: ReadonlyArray<string>;
    };
    firstImpression: {
      legend: string;
      lowLabel: string;
      highLabel: string;
    };
    mostInteresting: {
      label: string;
      placeholder: string;
      options: ReadonlyArray<string>;
    };
    confusingParts: string;
    trustworthy: {
      legend: string;
      options: ReadonlyArray<string>;
    };
    desiredContent: string;
    additionalFeedback: string;
    name: string;
    email: string;
  };
  privacyNote: string;
  unavailableButtonLabel: string;
};

export const feedbackContent = {
  tr: {
    locale: "tr",
    metadata: {
      title: "Beta Geri Bildirimi | Şaban Durali",
      description:
        "Şaban Durali Araştırma ve Bilgi Platformu beta sürümü için görüşlerinizi paylaşın.",
    },
    eyebrow: "BETA GERİ BİLDİRİMİ",
    heading: "Bu platformu birlikte geliştirelim.",
    description:
      "Bu beta geri bildirim sayfası, platformun içerik ve kullanıcı deneyimini geliştirmek için hazırlanmıştır. Form yeniden açıldığında görüşlerinizi yaklaşık 3–4 dakikada paylaşabileceksiniz.",
    unavailableMessage:
      "Beta geri bildirim formu veri koruma ve gönderim altyapısı tamamlanırken geçici olarak kapalıdır. Form yeniden açıldığında bu sayfadan görüşlerinizi paylaşabileceksiniz.",
    dataProtectionNote:
      "Form yeniden açılmadan önce veri işleme ve aktarım bilgileri bu sayfada açıklanacaktır. Bu aşamada form üzerinden herhangi bir veri alınmamaktadır.",
    requiredLabel: "Zorunlu",
    optionalLabel: "İsteğe bağlı",
    fields: {
      clarity: {
        legend: "İlk bakışta sitenin ne sunduğunu anlayabildiniz mi?",
        options: ["Evet", "Kısmen", "Hayır"],
      },
      firstImpression: {
        legend: "İlk izleniminizi nasıl değerlendirirsiniz?",
        lowLabel: "Çok zayıf",
        highLabel: "Çok iyi",
      },
      mostInteresting: {
        label: "En çok ilginizi çeken bölüm hangisi oldu?",
        placeholder: "Lütfen seçin",
        options: [
          "Kitap İncelemeleri",
          "İstanbul Analizleri",
          "Yapay Zekâ",
          "Satış ve Müzakere",
          "Hakkımda",
          "Tasarım ve genel görünüm",
          "Diğer",
        ],
      },
      confusingParts:
        "Eksik, gereksiz veya kafa karıştırıcı bulduğunuz bir bölüm var mı?",
      trustworthy: {
        legend: "Site size güvenilir ve profesyonel görünüyor mu?",
        options: ["Evet", "Kısmen", "Hayır"],
      },
      desiredContent:
        "Bu platformda gelecekte hangi içerikleri görmek istersiniz?",
      additionalFeedback:
        "Eklemek istediğiniz başka bir görüş veya öneri var mı?",
      name: "Adınız",
      email: "E-posta adresiniz",
    },
    privacyNote:
      "Ad ve e-posta alanları isteğe bağlıdır. Lütfen bu forma özel veya hassas kişisel bilgiler yazmayın.",
    unavailableButtonLabel: "Form geçici olarak kapalı",
  },
  en: {
    locale: "en",
    metadata: {
      title: "Beta Feedback | Şaban Durali",
      description:
        "Share your feedback on the beta version of the Şaban Durali Research and Knowledge Platform.",
    },
    eyebrow: "BETA FEEDBACK",
    heading: "Help shape this platform.",
    description:
      "This beta feedback page is designed to improve the platform's content and user experience. Once the form is reopened, you will be able to share your feedback in approximately 3–4 minutes.",
    unavailableMessage:
      "The beta feedback form is temporarily unavailable while its data-protection and submission infrastructure is being completed. You will be able to share your feedback on this page once it is reopened.",
    dataProtectionNote:
      "Before the form is reopened, information about data processing and transfers will be explained on this page. No data is being collected through the form at this stage.",
    requiredLabel: "Required",
    optionalLabel: "Optional",
    fields: {
      clarity: {
        legend: "Were you able to understand what the website offers at first glance?",
        options: ["Yes", "Partly", "No"],
      },
      firstImpression: {
        legend: "How would you rate your first impression?",
        lowLabel: "Very poor",
        highLabel: "Very good",
      },
      mostInteresting: {
        label: "Which section interested you the most?",
        placeholder: "Please select",
        options: [
          "Book Reviews",
          "Istanbul Research",
          "Artificial Intelligence",
          "Sales and Negotiation",
          "About",
          "Design and overall appearance",
          "Other",
        ],
      },
      confusingParts: "Was anything missing, unnecessary or confusing?",
      trustworthy: {
        legend: "Does the website feel trustworthy and professional?",
        options: ["Yes", "Partly", "No"],
      },
      desiredContent: "What kind of content would you like to see on this platform?",
      additionalFeedback: "Is there anything else you would like to suggest?",
      name: "Your name",
      email: "Your email address",
    },
    privacyNote:
      "Name and email are optional. Please do not enter private or sensitive personal information in this form.",
    unavailableButtonLabel: "Form temporarily unavailable",
  },
} satisfies Record<Locale, FeedbackContent>;
