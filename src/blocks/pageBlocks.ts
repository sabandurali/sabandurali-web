import type { Block, Field } from "payload";

function isSafeLink(value: unknown): true | string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "Bağlantı boş olamaz.";
  }

  const link = value.trim();

  if (/^#[a-z][a-z0-9-]*$/.test(link)) {
    return true;
  }

  if (link.startsWith("/") && !link.startsWith("//")) {
    return true;
  }

  try {
    const url = new URL(link);
    return url.protocol === "http:" || url.protocol === "https:"
      ? true
      : "Yalnız site içi, http veya https bağlantıları kullanılabilir.";
  } catch {
    return "Geçerli bir site içi, http veya https bağlantısı girin.";
  }
}

function isValidAnchor(value: unknown): true | string {
  if (value === null || value === undefined || value === "") return true;

  return typeof value === "string" &&
    /^[a-z][a-z0-9-]*$/.test(value)
    ? true
    : "Bölüm kimliği küçük harf veya sayı içermeli; harfle başlamalı ve yalnız tire kullanmalıdır.";
}

const commonFields: Field[] = [
  {
    name: "visible",
    type: "checkbox",
    label: "Bölümü göster",
    defaultValue: true,
    admin: {
      description:
        "Kapalıysa blok silinmeden public sayfada gizlenir.",
    },
  },
  {
    name: "anchor",
    type: "text",
    label: "Bölüm kimliği (anchor)",
    admin: {
      description:
        "İsteğe bağlıdır. Örnek: hakkimda veya calismalar.",
    },
    validate: isValidAnchor,
  },
];

const linkFields: Field[] = [
  {
    name: "label",
    type: "text",
    label: "Bağlantı metni",
    required: true,
  },
  {
    name: "href",
    type: "text",
    label: "Bağlantı adresi",
    required: true,
    validate: isSafeLink,
  },
];

export const HeroBlock: Block = {
  slug: "hero",
  labels: {
    plural: "Hero bölümleri",
    singular: "Hero",
  },
  fields: [
    ...commonFields,
    {
      name: "eyebrow",
      type: "text",
      label: "Üst başlık",
    },
    {
      name: "titleLines",
      type: "array",
      label: "Başlık satırları",
      minRows: 1,
      required: true,
      fields: [
        {
          name: "text",
          type: "text",
          label: "Metin",
          required: true,
        },
        {
          name: "accent",
          type: "checkbox",
          label: "Vurgu rengi",
          defaultValue: false,
        },
      ],
    },
    {
      name: "description",
      type: "textarea",
      label: "Açıklama",
      required: true,
    },
    {
      name: "primaryAction",
      type: "group",
      label: "Birincil bağlantı",
      fields: linkFields,
    },
    {
      name: "secondaryAction",
      type: "group",
      label: "İkincil bağlantı",
      fields: linkFields,
    },
    {
      name: "highlights",
      type: "array",
      label: "Yan panel bilgileri",
      maxRows: 4,
      fields: [
        {
          name: "value",
          type: "text",
          label: "Değer",
          required: true,
        },
        {
          name: "label",
          type: "text",
          label: "Açıklama",
          required: true,
        },
      ],
    },
  ],
};

export const RichTextBlock: Block = {
  slug: "richText",
  labels: {
    plural: "Zengin metin bölümleri",
    singular: "Zengin metin",
  },
  fields: [
    ...commonFields,
    {
      name: "eyebrow",
      type: "text",
      label: "Üst başlık",
    },
    {
      name: "title",
      type: "text",
      label: "Başlık",
    },
    {
      name: "content",
      type: "richText",
      label: "İçerik",
      required: true,
    },
  ],
};

export const CardGroupBlock: Block = {
  slug: "cardGroup",
  labels: {
    plural: "Kart grupları",
    singular: "Kart grubu",
  },
  fields: [
    ...commonFields,
    {
      name: "eyebrow",
      type: "text",
      label: "Üst başlık",
    },
    {
      name: "title",
      type: "text",
      label: "Başlık",
      required: true,
    },
    {
      name: "cards",
      type: "array",
      label: "Kartlar",
      minRows: 1,
      required: true,
      fields: [
        {
          name: "icon",
          type: "select",
          label: "Simge",
          defaultValue: "book",
          options: [
            { label: "Kitap", value: "book" },
            { label: "Şehir", value: "city" },
            { label: "Ağ", value: "network" },
            { label: "İş birliği", value: "handshake" },
          ],
        },
        {
          name: "image",
          type: "upload",
          label: "Görsel",
          relationTo: "media",
        },
        {
          name: "imageAlt",
          type: "text",
          label: "Görsel alternatif metni",
          admin: {
            condition: (_, siblingData) => Boolean(siblingData.image),
          },
        },
        {
          name: "title",
          type: "text",
          label: "Başlık",
          required: true,
        },
        {
          name: "description",
          type: "textarea",
          label: "Açıklama",
          required: true,
        },
        {
          name: "link",
          type: "group",
          label: "Bağlantı",
          fields: [
            {
              name: "label",
              type: "text",
              label: "Bağlantı metni",
            },
            {
              name: "href",
              type: "text",
              label: "Bağlantı adresi",
              validate: (value: unknown) =>
                value === null || value === undefined || value === ""
                  ? true
                  : isSafeLink(value),
            },
          ],
        },
      ],
    },
  ],
};

export const ImageTextBlock: Block = {
  slug: "imageText",
  labels: {
    plural: "Görsel ve metin bölümleri",
    singular: "Görsel + metin",
  },
  fields: [
    ...commonFields,
    {
      name: "eyebrow",
      type: "text",
      label: "Üst başlık",
    },
    {
      name: "title",
      type: "text",
      label: "Başlık",
      required: true,
    },
    {
      name: "content",
      type: "richText",
      label: "Metin",
      required: true,
    },
    {
      name: "image",
      type: "upload",
      label: "Görsel",
      relationTo: "media",
      required: true,
    },
    {
      name: "imageAlt",
      type: "text",
      label: "Görsel alternatif metni",
      required: true,
    },
    {
      name: "imagePosition",
      type: "select",
      label: "Görsel konumu",
      defaultValue: "right",
      options: [
        { label: "Sağ", value: "right" },
        { label: "Sol", value: "left" },
      ],
      required: true,
    },
  ],
};

export const CtaBlock: Block = {
  slug: "cta",
  labels: {
    plural: "CTA bölümleri",
    singular: "CTA",
  },
  fields: [
    ...commonFields,
    {
      name: "title",
      type: "text",
      label: "Başlık",
      required: true,
    },
    {
      name: "description",
      type: "textarea",
      label: "Açıklama",
    },
    {
      name: "action",
      type: "group",
      label: "Bağlantı",
      fields: linkFields,
    },
  ],
};

export const pageBlocks = [
  HeroBlock,
  RichTextBlock,
  CardGroupBlock,
  ImageTextBlock,
  CtaBlock,
];
