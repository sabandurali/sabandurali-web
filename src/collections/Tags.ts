import type { CollectionConfig } from "payload";
import { adminOnly, adminOrEditor } from "@/lib/payloadAccess";
import {
  createLocalizedSlugField,
  createLocalizedSlugHook,
} from "@/lib/localizedSlug";
import { preventDeletingReferencedTag } from "@/lib/payloadDeleteGuards";
import { createRevalidationHooks } from "@/lib/revalidation";

const revalidation = createRevalidationHooks("tags");

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
    listSearchableFields: ["title", "slug"],
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
      label: "Başlık",
      localized: true,
      required: true,
    },
    {
      ...createLocalizedSlugField({
        collection: "tags",
        sourceField: "title",
      }),
      label: "Slug",
    },
    {
      name: "description",
      type: "textarea",
      label: "Açıklama",
      localized: true,
    },
  ],
  hooks: {
    afterChange: [revalidation.afterChange],
    afterDelete: [revalidation.afterDelete],
    beforeDelete: [preventDeletingReferencedTag],
    beforeValidate: [
      createLocalizedSlugHook({
        collection: "tags",
        sourceField: "title",
      }),
    ],
  },
};
