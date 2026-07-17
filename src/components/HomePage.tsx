import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/layout/BackToTop";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import FocusAreas from "@/components/sections/FocusAreas";
import type { HomeContent } from "@/content/homeContent";

export default function HomePage({ content }: { content: HomeContent }) {
  return (
    <div id="top" lang={content.locale}>
      <Header
        locale={content.locale}
        anchors={content.anchors}
        content={content.header}
      />
      <main>
        <Hero anchors={content.anchors} content={content.hero} />
        <About id={content.anchors.about} content={content.about} />
        <FocusAreas id={content.anchors.work} content={content.focusAreas} />
      </main>
      <Footer id={content.anchors.contact} content={content.footer} />
      <BackToTop label={content.backToTopLabel} />
    </div>
  );
}
