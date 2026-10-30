import type { Locale } from "@/content/homeContent";

/**
 * Button and status texts of a form submission. The content layer owns the
 * shape; the form components render it (src/components/forms/).
 */
export type SubmissionMessages = {
  submit: string;
  submitting: string;
  success: string;
  error: string;
  configurationError: string;
  submitAnother: string;
};

/** The privacy notice sentence under a form: text, link label, text. */
export type PrivacyAcknowledgementContent = {
  prefix: string;
  linkLabel: string;
  suffix: string;
};

export type ContactContent = {
  locale: Locale;
  eyebrow: string;
  heading: string;
  description: string;
  requiredLabel: string;
  fields: {
    name: string;
    email: string;
    subject: string;
    subjectPlaceholder: string;
    subjectOptions: ReadonlyArray<string>;
    message: string;
  };
  privacyAcknowledgement: PrivacyAcknowledgementContent;
  submission: SubmissionMessages;
};

export const contactContent = {
  tr: {
    locale: "tr",
    eyebrow: "İLETİŞİM",
    heading: "Benimle iletişime geçin.",
    description:
      "İş birliği, danışmanlık, araştırma veya platformla ilgili mesajınızı form aracılığıyla iletebilirsiniz.",
    requiredLabel: "Zorunlu",
    fields: {
      name: "Ad soyad",
      email: "E-posta",
      subject: "Konu",
      subjectPlaceholder: "Lütfen seçin",
      subjectOptions: [
        "Genel iletişim",
        "İş birliği",
        "Danışmanlık",
        "Araştırma",
        "Teknik bildirim",
        "Diğer",
      ],
      message: "Mesaj",
    },
    privacyAcknowledgement: {
      prefix: "",
      linkLabel: "KVKK Aydınlatma Metni",
      suffix: "’ni okudum.",
    },
    submission: {
      submit: "Mesajı gönder",
      submitting: "Mesajınız gönderiliyor…",
      success:
        "Mesajınız alındı. Uygun olduğumda size e-posta yoluyla dönüş yapacağım.",
      error: "Mesaj şu anda gönderilemedi. Lütfen daha sonra yeniden deneyin.",
      configurationError: "İletişim formu geçici olarak kullanılamıyor.",
      submitAnother: "Yeni mesaj gönder",
    },
  },
  en: {
    locale: "en",
    eyebrow: "CONTACT",
    heading: "Get in touch.",
    description:
      "You can use the form to send a message about collaboration, consulting, research or the platform.",
    requiredLabel: "Required",
    fields: {
      name: "Full name",
      email: "Email",
      subject: "Subject",
      subjectPlaceholder: "Please select",
      subjectOptions: [
        "General enquiry",
        "Collaboration",
        "Consulting",
        "Research",
        "Technical issue",
        "Other",
      ],
      message: "Message",
    },
    privacyAcknowledgement: {
      prefix: "I have read the ",
      linkLabel: "Privacy Notice",
      suffix: ".",
    },
    submission: {
      submit: "Send message",
      submitting: "Your message is being sent…",
      success:
        "Your message has been received. I will reply by email when I am available.",
      error:
        "Your message could not be sent right now. Please try again later.",
      configurationError: "The contact form is temporarily unavailable.",
      submitAnother: "Send another message",
    },
  },
} satisfies Record<Locale, ContactContent>;
