import { ADMIN_HELP_GUIDE } from "../../src/components/admin/help/admin-help-guide";

/** The repository copy of the admin guide, generated from the admin help view. */
export const adminGuideMarkdownPath = "YONETIM-PANELI-KULLANIM-KILAVUZU.md";

export const adminGuideGeneratedNotice =
  "<!-- Generated from src/components/admin/help/admin-help-guide.ts by `npm run generate:admin-guide`. Edit that file, not this one. -->";

export function renderAdminGuideMarkdown(): string {
  return `${adminGuideGeneratedNotice}\n\n${ADMIN_HELP_GUIDE}`;
}
