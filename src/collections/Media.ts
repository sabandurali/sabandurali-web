import path from "node:path";
import type { CollectionConfig } from "payload";
import { adminOrEditor, denyAnonymousRestReads } from "@/lib/payloadAccess";
import { preventDeletingReferencedMedia } from "@/lib/payloadDeleteGuards";
import { createRevalidationHooks } from "@/lib/revalidation";

/** Longest edge of a stored image; larger uploads are scaled down. */
export const MEDIA_MAX_IMAGE_EDGE = 3200;

const revalidation = createRevalidationHooks("media");

/**
 * Media files are public by URL: published pages load them from
 * `/api/media/file/*` (and Vercel Blob in production) without a session, so
 * `read` stays open. Anonymous REST listing is refused, which keeps the
 * uploads of unpublished drafts out of `/api/media`.
 */
export const Media: CollectionConfig = {
  slug: "media",
  access: {
    create: adminOrEditor,
    delete: adminOrEditor,
    read: () => true,
    update: adminOrEditor,
  },
  admin: {
    description:
      "Yüklenen her dosya, adresini bilen herkes tarafından açılabilir; kişisel veya gizli belge yüklemeyin. Görseller uzun kenarı en fazla 3200 piksel olacak biçimde yeniden kaydedilir ve konum, cihaz ve çekim zamanı (EXIF) bilgileri silinir.",
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
  hooks: {
    afterChange: [revalidation.afterChange],
    afterDelete: [revalidation.afterDelete],
    beforeDelete: [preventDeletingReferencedMedia],
    beforeOperation: [denyAnonymousRestReads],
  },
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
    // Any resize option makes sharp re-encode every image (rotated upright
    // first). Without `withMetadata` the re-encoded original drops EXIF, GPS
    // and device data that phones and cameras embed.
    resizeOptions: {
      fit: "inside",
      height: MEDIA_MAX_IMAGE_EDGE,
      width: MEDIA_MAX_IMAGE_EDGE,
      withoutEnlargement: true,
    },
    staticDir: path.resolve(process.cwd(), "public/media"),
    withMetadata: false,
  },
};
