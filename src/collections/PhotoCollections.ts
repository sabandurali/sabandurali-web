import type { CollectionConfig } from "payload";
import { adminOnly, adminOrEditor } from "@/lib/payloadAccess";
import {
  createLocalizedSlugField,
  createLocalizedSlugHook,
} from "@/lib/localizedSlug";
import { preventDeletingReferencedPhotoCollection } from "@/lib/payloadDeleteGuards";

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
      localized: true,
      required: true,
    },
    createLocalizedSlugField({
      collection: "photo-collections",
      sourceField: "title",
    }),
    {
      name: "description",
      type: "textarea",
      localized: true,
    },
    {
      name: "parent",
      type: "relationship",
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
      defaultValue: 0,
      min: 0,
    },
  ],
  hooks: {
    beforeDelete: [preventDeletingReferencedPhotoCollection],
    beforeValidate: [
      createLocalizedSlugHook({
        collection: "photo-collections",
        sourceField: "title",
      }),
    ],
  },
};
