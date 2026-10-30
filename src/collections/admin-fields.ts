import type { UIField } from "payload";

/**
 * Sidebar panel with the record's public state (Yayında / Planlandı /
 * Taslak) and its addresses on the site. A `ui` field stores nothing.
 */
export const publicLinksField: UIField = {
  name: "publicLinks",
  type: "ui",
  label: "Sitede",
  admin: {
    components: {
      Field: "/components/admin/public-links/PublicLinksField#PublicLinksField",
    },
    position: "sidebar",
  },
};

/**
 * Live search result and share card preview inside an SEO group. It reads
 * the form values and the same fallbacks as the public metadata.
 */
export function seoPreviewField(
  kind: "articles" | "pages" | "photos",
): UIField {
  return {
    name: "seoPreview",
    type: "ui",
    label: "Arama ve paylaşım önizlemesi",
    admin: {
      components: {
        Field: {
          clientProps: { kind },
          path: "/components/admin/seo/SeoPreviewField#SeoPreviewField",
        },
      },
    },
  };
}
