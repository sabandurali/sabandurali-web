import path from "node:path";
import type { CollectionConfig } from "payload";
import { adminOrEditor } from "@/lib/payloadAccess";

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    create: adminOrEditor,
    delete: adminOrEditor,
    read: () => true,
    update: adminOrEditor,
  },
  admin: {
    group: "İçerik",
    useAsTitle: "filename",
  },
  fields: [
    {
      name: "alt",
      type: "text",
      label: "Alternatif metin",
      admin: {
        description:
          "Görseli, içeriği görmeyen bir kullanıcı için kısa ve anlamlı biçimde açıklayın.",
      },
      required: true,
    },
    {
      name: "description",
      type: "textarea",
      label: "Açıklama",
    },
    {
      name: "sourceCopyright",
      type: "text",
      label: "Kaynak / telif",
    },
  ],
  upload: {
    bulkUpload: false,
    crop: false,
    filesRequiredOnCreate: true,
    focalPoint: false,
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ],
    pasteURL: false,
    staticDir: path.resolve(process.cwd(), "public/media"),
  },
};
