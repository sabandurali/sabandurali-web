import type { CollectionConfig } from "payload";
import { adminOnly, adminOrEditor } from "@/lib/payloadAccess";
import {
  createLocalizedSlugField,
  createLocalizedSlugHook,
} from "@/lib/localizedSlug";
import { preventDeletingReferencedPhotoCollection } from "@/lib/payloadDeleteGuards";
import { createRevalidationHooks } from "@/lib/revalidation";

const revalidation = createRevalidationHooks("photo-collections");

export const PhotoCollections: CollectionConfig = {
  slug: "photo-collections",
  access: {
    create: adminOrEditor,
    delete: adminOnly,
    read: () => true,
    update: adminOrEditor,
  },
  admin: {
    defaultColumns: ["title", "parent", "sortOrder", "updatedAt"],
    group: "Fotoğrafçılık",
    listSearchableFields: ["title", "slug"],
    useAsTitle: "title",
  },
  labels: {
    plural: "Fotoğraf Koleksiyonları",
    singular: "Fotoğraf Koleksiyonu",
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
        collection: "photo-collections",
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
    {
      name: "parent",
      type: "relationship",
      label: "Üst koleksiyon",
      relationTo: "photo-collections",
      admin: {
        description:
          "Alt koleksiyon için üst koleksiyonu seçin. Ana koleksiyonlarda boş bırakın.",
      },
      filterOptions: ({ id }) =>
        id === undefined ? true : { id: { not_equals: id } },
    },
    {
      name: "sortOrder",
      type: "number",
      label: "Sıra",
      defaultValue: 0,
      min: 0,
    },
  ],
  hooks: {
    afterChange: [revalidation.afterChange],
    afterDelete: [revalidation.afterDelete],
    beforeDelete: [preventDeletingReferencedPhotoCollection],
    beforeValidate: [
      createLocalizedSlugHook({
        collection: "photo-collections",
        sourceField: "title",
      }),
    ],
  },
};
