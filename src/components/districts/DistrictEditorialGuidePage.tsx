import BackToTop from "@/components/layout/BackToTop";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { getDistrictPath } from "@/content/districts/district-routes";
import { homeContent } from "@/content/homeContent";
import DistrictGuideArticle, {
  type DistrictGuideArticleProps,
} from "./DistrictGuideArticle";

/** The district guide route: site header, the Atlas guide and the footer. */
export default function DistrictEditorialGuidePage({
  district,
  data,
}: DistrictGuideArticleProps) {
  const home = homeContent.tr;

  return (
    <div id="top" lang="tr">
      <Header
        locale="tr"
        anchors={home.anchors}
        content={home.header}
        homeHref="/"
        anchorPrefix="/"
        languageHrefs={{ tr: getDistrictPath(district.slug), en: "/en" }}
      />
      <main id="main" className="bg-paper text-ink scheme-light">
        <DistrictGuideArticle district={district} data={data} />
      </main>
      <Footer id={home.anchors.contact} content={home.footer} />
      <BackToTop label={home.backToTopLabel} />
    </div>
  );
}
