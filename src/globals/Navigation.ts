import type {
  Field,
  FieldHook,
  GlobalConfig,
  RelationshipField,
  TextFieldSingleValidation,
} from "payload";
import { adminOrEditor } from "@/lib/payloadAccess";
import {
  normalizeExternalNavigationUrl,
  normalizeInternalNavigationPath,
} from "@/content/navigation/navigation-links";

type LinkFieldOptions = {
  allowContactProtocols?: boolean;
  language?: "en" | "tr";
};

function hasLinkType(
  value: unknown,
  linkType: "external" | "internal",
): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "linkType" in value &&
    value.linkType === linkType
  );
}

const normalizeInternalPath: FieldHook = ({ value }) =>
  normalizeInternalNavigationPath(value) ?? value;

const validateInternalPath: TextFieldSingleValidation = (
  value,
  { siblingData },
) =>
  !hasLinkType(siblingData, "internal") ||
  value === null ||
  value === undefined ||
  value === ""
    ? true
    : normalizeInternalNavigationPath(value) === null
      ? "Geçerli ve / ile başlayan güvenli bir site içi rota girin."
      : true;

function createExternalUrlNormalizer(
  allowContactProtocols: boolean,
): FieldHook {
  return ({ value }) =>
    normalizeExternalNavigationUrl(value, allowContactProtocols) ?? value;
}

function createExternalUrlValidator(
  allowContactProtocols: boolean,
): TextFieldSingleValidation {
  return (value, { siblingData }) =>
    !hasLinkType(siblingData, "external") ||
    value === null ||
    value === undefined ||
    value === ""
      ? true
      : normalizeExternalNavigationUrl(
            value,
            allowContactProtocols,
          ) === null
        ? allowContactProtocols
          ? "Geçerli bir https://, mailto: veya tel: adresi girin."
          : "Geçerli ve https:// ile başlayan güvenli bir adres girin."
        : true;
}

function createPageRelationshipField(
  language: "en" | "tr",
): RelationshipField {
  return {
    name: "page",
    type: "relationship",
    label: "CMS sayfası",
    admin: {
      condition: (_, siblingData) => siblingData.linkType === "page",
      description:
        language === "tr"
          ? "Yalnız yayımlanmış ve yayın tarihi gelmiş Türkçe sayfalar public menüde bağlantıya dönüşür."
          : "Yalnız yayımlanmış ve yayın tarihi gelmiş İngilizce sayfalar public menüde bağlantıya dönüşür.",
    },
    filterOptions: {
      language: {
        equals: language,
      },
    },
    relationTo: "pages",
  };
}

function createNavigationLinkFields({
  allowContactProtocols = false,
  language = "tr",
}: LinkFieldOptions = {}): Field[] {
  return [
    {
      name: "label",
      type: "text",
      label: "Bağlantı etiketi",
      required: true,
    },
    {
      name: "active",
      type: "checkbox",
      label: "Bağlantıyı göster",
      defaultValue: true,
    },
    {
      name: "linkType",
      type: "select",
      label: "Bağlantı türü",
      defaultValue: "internal",
      options: [
        { label: "CMS sayfası", value: "page" },
        { label: "Site içi rota", value: "internal" },
        { label: "Güvenli haricî URL", value: "external" },
      ],
      required: true,
    },
    createPageRelationshipField(language),
    {
      name: "internalPath",
      type: "text",
      label: "Site içi rota",
      admin: {
        condition: (_, siblingData) => siblingData.linkType === "internal",
        description:
          "Kökten başlayan bir rota girin. Örnek: /, /makaleler veya /#hakkimda.",
      },
      hooks: {
        beforeValidate: [normalizeInternalPath],
      },
      validate: validateInternalPath,
    },
    {
      name: "externalUrl",
      type: "text",
      label: "Haricî adres",
      admin: {
        condition: (_, siblingData) => siblingData.linkType === "external",
        description: allowContactProtocols
          ? "https://, mailto: veya tel: adresi kullanın."
          : "Yalnız https:// ile başlayan güvenli adres kullanın.",
      },
      hooks: {
        beforeValidate: [
          createExternalUrlNormalizer(allowContactProtocols),
        ],
      },
      validate: createExternalUrlValidator(allowContactProtocols),
    },
    {
      name: "newTab",
      type: "checkbox",
      label: "Yeni sekmede aç",
      defaultValue: false,
      admin: {
        condition: (_, siblingData) => siblingData.linkType === "external",
      },
    },
  ];
}

export const Navigation: GlobalConfig = {
  slug: "navigation",
  access: {
    read: adminOrEditor,
    readVersions: adminOrEditor,
    update: adminOrEditor,
  },
  admin: {
    description:
      "Türkçe ve İngilizce Header, mobil menü ve Footer bağlantılarını yönetin. Taslak, yayınlama ve sürüm geçmişi sağ üstteki belge kontrollerindedir.",
    group: "İçerik",
  },
  label: "Navigasyon",
  lockDocuments: false,
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Türkçe Header menüsü",
          fields: [
            {
              name: "headerItems",
              type: "array",
              label: "Menü öğeleri",
              admin: {
                description:
                  "Masaüstü ve mobil menü aynı sıralı listeyi kullanır.",
              },
              fields: [
                ...createNavigationLinkFields(),
                {
                  name: "children",
                  type: "array",
                  label: "Alt menü öğeleri",
                  admin: {
                    description:
                      "Yalnız bir alt menü seviyesi desteklenir.",
                  },
                  fields: createNavigationLinkFields(),
                },
              ],
            },
          ],
        },
        {
          label: "English Header menu",
          fields: [
            {
              name: "enHeader",
              type: "array",
              label: "Menu items",
              admin: {
                description:
                  "Desktop and mobile navigation use the same ordered list.",
              },
              fields: [
                ...createNavigationLinkFields({ language: "en" }),
                {
                  name: "children",
                  type: "array",
                  label: "Child menu items",
                  admin: {
                    description: "Only one child-menu level is supported.",
                  },
                  fields: createNavigationLinkFields({ language: "en" }),
                },
              ],
            },
          ],
        },
        {
          label: "Türkçe Footer bağlantı grupları",
          fields: [
            {
              name: "footerGroups",
              type: "array",
              label: "Bağlantı grupları",
              fields: [
                {
                  name: "title",
                  type: "text",
                  label: "Grup başlığı",
                },
                {
                  name: "active",
                  type: "checkbox",
                  label: "Grubu göster",
                  defaultValue: true,
                },
                {
                  name: "links",
                  type: "array",
                  label: "Bağlantılar",
                  fields: createNavigationLinkFields({
                    allowContactProtocols: true,
                  }),
                },
              ],
            },
          ],
        },
        {
          label: "English Footer link groups",
          fields: [
            {
              name: "enFooter",
              type: "array",
              label: "Link groups",
              fields: [
                {
                  name: "title",
                  type: "text",
                  label: "Group title",
                },
                {
                  name: "active",
                  type: "checkbox",
                  label: "Show group",
                  defaultValue: true,
                },
                {
                  name: "links",
                  type: "array",
                  label: "Links",
                  fields: createNavigationLinkFields({
                    allowContactProtocols: true,
                    language: "en",
                  }),
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  versions: {
    drafts: {
      validate: true,
    },
    max: 25,
  },
};
