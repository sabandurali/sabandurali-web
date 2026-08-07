import type { CollectionConfig } from "payload";
import { adminOnly, adminOrEditor } from "@/lib/payloadAccess";
import {
  createLocalizedSlugField,
  createLocalizedSlugHook,
} from "@/lib/localizedSlug";
import { preventDeletingReferencedTag } from "@/lib/payloadDeleteGuards";

export const Tags: CollectionConfig = {
  slug: "tags",
  access: {
    create: adminOrEditor,
    delete: adminOnly,
    read: () => true,
    update: adminOrEditor,
  },
  admin: {
    defaultColumns: ["title", "slug", "updatedAt"],
    group: "Fotoğrafçılık",
    useAsTitle: "title",
  },
  labels: {
    plural: "Etiketler",
    singular: "Etiket",
  },
  fields: [
    {
      name: "title",
      type: "text",
      localized: true,
      required: true,
    },
    createLocalizedSlugField({
      collection: "tags",
      sourceField: "title",
    }),
    {
      name: "description",
      type: "textarea",
      localized: true,
    },
  ],
  hooks: {
    beforeDelete: [preventDeletingReferencedTag],
    beforeValidate: [
      createLocalizedSlugHook({
        collection: "tags",
        sourceField: "title",
      }),
    ],
  },
};
