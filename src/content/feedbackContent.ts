import type { SubmissionMessages } from "@/components/forms/FormStatus";
import type { PrivacyAcknowledgementContent } from "@/components/forms/PrivacyAcknowledgement";
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
  dataNotice: string;
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
  privacyAcknowledgement: PrivacyAcknowledgementContent;
  submission: SubmissionMessages;
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
      "Siteyi birkaç dakika inceleyerek görüşlerinizi paylaşmanız, içerik ve kullanıcı deneyimini daha doğru geliştirmeme yardımcı olacaktır. Formun tamamlanması yaklaşık 3–4 dakika sürer.",
    dataNotice:
      "Form aracılığıyla ilettiğiniz bilgiler, geri bildiriminizi değerlendirmek ve platformu geliştirmek amacıyla işlenir. Ayrıntılar için KVKK Aydınlatma Metni’ni inceleyin. Lütfen özel nitelikli veya gereksiz kişisel bilgiler paylaşmayın.",
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
    privacyAcknowledgement: {
      prefix: "",
      linkLabel: "KVKK Aydınlatma Metni",
      suffix: "’ni okudum.",
    },
    submission: {
      submit: "Geri bildirimi gönder",
      submitting: "Geri bildiriminiz gönderiliyor…",
      success: "Teşekkür ederim. Geri bildiriminiz başarıyla gönderildi.",
      error:
        "Geri bildirim şu anda gönderilemedi. Lütfen daha sonra yeniden deneyin.",
      configurationError:
        "Beta geri bildirim formu geçici olarak kullanılamıyor.",
      submitAnother: "Yeni geri bildirim gönder",
    },
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
      "Spending a few minutes reviewing the website and sharing your thoughts will help me improve its content and user experience. The form takes approximately 3–4 minutes to complete.",
    dataNotice:
      "The information you submit through this form is processed to evaluate your feedback and improve the platform. Please review the Privacy Notice for details. Do not share sensitive or unnecessary personal information.",
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
    privacyAcknowledgement: {
      prefix: "I have read the ",
      linkLabel: "Privacy Notice",
      suffix: ".",
    },
    submission: {
      submit: "Submit feedback",
      submitting: "Your feedback is being submitted…",
      success: "Thank you. Your feedback has been submitted successfully.",
      error:
        "Your feedback could not be submitted right now. Please try again later.",
      configurationError: "The beta feedback form is temporarily unavailable.",
      submitAnother: "Submit more feedback",
    },
  },
} satisfies Record<Locale, FeedbackContent>;
