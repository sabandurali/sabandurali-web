import type { CollectionConfig } from "payload";
import { adminOnly, adminOrEditor } from "@/lib/payloadAccess";
import {
  createLocalizedSlugField,
  createLocalizedSlugHook,
} from "@/lib/localizedSlug";

export const Categories: CollectionConfig = {
  slug: "categories",
  access: {
    create: adminOrEditor,
    delete: adminOnly,
    read: () => true,
    update: adminOrEditor,
  },
  admin: {
    defaultColumns: ["name", "slug", "sortOrder", "updatedAt"],
    group: "İçerik",
    useAsTitle: "name",
  },
  fields: [
    {
      name: "name",
      type: "text",
      localized: true,
      required: true,
    },
    createLocalizedSlugField({
      collection: "categories",
      sourceField: "name",
    }),
    {
      name: "description",
      type: "textarea",
      localized: true,
    },
    {
      name: "sortOrder",
      type: "number",
      admin: {
        description:
          "Kategorilerin yönetim panelindeki sıralamasını belirlemek için kullanılır.",
      },
      defaultValue: 0,
      min: 0,
    },
  ],
  hooks: {
    beforeValidate: [
      createLocalizedSlugHook({
        collection: "categories",
        sourceField: "name",
      }),
    ],
  },
};
