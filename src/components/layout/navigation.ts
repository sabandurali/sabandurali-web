/**
 * @deprecated The static navigation data moved to
 * `src/content/navigation/static-navigation.ts` (ARC-7). This re-export only
 * keeps `scripts/package-01.test.ts` working until it imports from the new
 * module; delete this file afterwards. Do not import it in new code.
 */
export {
  getEnglishHeaderNavigationItems,
  getStaticFooterGroups,
} from "@/content/navigation/static-navigation";
