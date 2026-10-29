import PageShell from "@/components/workspaces/PageShell";
import { getDistrictPath } from "@/content/districts/district-routes";
import DistrictGuideArticle, {
  type DistrictGuideArticleProps,
} from "./DistrictGuideArticle";

/** The district guide route: site header, the Atlas guide and the footer. */
export default function DistrictEditorialGuidePage({
  district,
  data,
}: DistrictGuideArticleProps) {
  return (
    <PageShell
      locale="tr"
      languageHrefs={{ tr: getDistrictPath(district.slug), en: "/en" }}
    >
      <main id="main" className="bg-paper text-ink scheme-light">
        <DistrictGuideArticle district={district} data={data} />
      </main>
    </PageShell>
  );
}
