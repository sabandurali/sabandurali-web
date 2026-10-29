import type { RichText } from "@payloadcms/richtext-lexical/react";
import type { ComponentProps } from "react";
import { getText, isRecord } from "@/content/guards";

/**
 * Lexical rich text as the public layer hands it to components: the data
 * type of the renderer, never the generated Payload document type, so a
 * regenerated `payload-types.ts` cannot change the public contract.
 * Articles and pages share this one type and these guards.
 */
export type PublicRichText = ComponentProps<typeof RichText>["data"];

/** The shape the renderer needs: a root node with a children array. */
export function isPublicRichText(value: unknown): value is PublicRichText {
  return (
    isRecord(value) &&
    isRecord(value.root) &&
    Array.isArray(value.root.children)
  );
}

function hasMeaningfulNode(node: unknown): boolean {
  if (!isRecord(node)) return false;
  if (node.type === "text") return getText(node.text) !== null;
  if (node.type === "upload") return true;

  return Array.isArray(node.children) && node.children.some(hasMeaningfulNode);
}

/**
 * A Lexical value has visible content when a text node has non-blank text or
 * an upload node is present. The publish validation of the CMS and the
 * public article mapper both apply this rule.
 */
export function hasMeaningfulRichText(value: unknown): boolean {
  return (
    isPublicRichText(value) &&
    value.root.children.some((node: unknown) => hasMeaningfulNode(node))
  );
}

/** Public rich text that also has visible content. */
export function isMeaningfulPublicRichText(
  value: unknown,
): value is PublicRichText {
  return isPublicRichText(value) && hasMeaningfulRichText(value);
}
