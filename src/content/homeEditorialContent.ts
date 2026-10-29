import type { Locale } from "@/content/homeContent";

/**
 * Editorial lines of the home page that are not part of the CMS home
 * record. Only the manifesto is rendered; the pre-atlas home sections
 * (hero data, discovery, real estate, knowledge cards) were retired with
 * their photos (`brand-assets/retired-home-images/`).
 */
export type HomeEditorialContent = {
  manifestoLines: ReadonlyArray<string>;
};

export const homeEditorialContent = {
  tr: {
    manifestoLines: [
      "Bilgi, paylaşıldığında büyür.",
      "Analiz, doğru sorularla başlar.",
      "Değer, tutarlılıkla oluşur.",
    ],
  },
  en: {
    manifestoLines: [
      "Knowledge grows when it is shared.",
      "Analysis begins with the right questions.",
      "Value is built through consistency.",
    ],
  },
} satisfies Record<Locale, HomeEditorialContent>;
