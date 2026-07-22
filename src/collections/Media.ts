import path from "node:path";
import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    create: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  admin: {
    useAsTitle: "filename",
  },
  fields: [
    {
      name: "alt",
      type: "text",
      label: "Alternative text",
      required: true,
    },
    {
      name: "description",
      type: "textarea",
      label: "Description",
    },
    {
      name: "sourceCopyright",
      type: "text",
      label: "Source / copyright",
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
