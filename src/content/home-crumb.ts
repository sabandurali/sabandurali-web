import type { SiteLocale } from "@/content/locales";

/**
 * The first breadcrumb item of every locale: the home page. The content
 * layer's JSON-LD breadcrumbs use it, and the visible breadcrumb of the UI
 * primitives (src/components/ui/strings.ts) names the same item, so the
 * label lives below both layers.
 */
export const homeCrumb: Record<SiteLocale, { name: string; path: string }> = {
  tr: { name: "Ana sayfa", path: "/" },
  en: { name: "Home", path: "/en" },
};
