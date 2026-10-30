/**
 * Collections an editor may link to from rich text. Each one has a public
 * route that `getInternalDocumentPath` resolves, and the Lexical link feature
 * in `payload.config.ts` offers exactly these, so the editor cannot create an
 * internal link that the public site would have to drop.
 *
 * Kept free of imports so the Payload config can load it.
 */
export const INTERNAL_LINK_COLLECTIONS = [
  "articles",
  "pages",
  "books",
  "photos",
  "district-guides",
] as const;

export type InternalLinkCollection = (typeof INTERNAL_LINK_COLLECTIONS)[number];
