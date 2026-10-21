import BackToTop from "@/components/layout/BackToTop";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import PageBlocks from "@/components/pages/PageBlocks";
import { homeContent } from "@/content/homeContent";
import type { PublicPage } from "@/content/pages/public-types";

export default function PublicPageView({ page }: { page: PublicPage }) {
  const home = homeContent.tr;
  const isHome = page.pageType === "home";

  return (
    <div id="top" lang="tr">
      <Header
        locale="tr"
        anchors={home.anchors}
        content={home.header}
        homeHref={isHome ? "#top" : "/"}
        anchorPrefix={isHome ? "" : "/"}
      />
      <main>
        <PageBlocks blocks={page.layout} />
      </main>
      <Footer id={home.anchors.contact} content={home.footer} />
      <BackToTop label={home.backToTopLabel} />
    </div>
  );
}
