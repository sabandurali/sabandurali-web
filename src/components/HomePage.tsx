import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/layout/BackToTop";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import FocusAreas from "@/components/sections/FocusAreas";
import type { HomeContent } from "@/content/homeContent";

export default function HomePage({ content }: { content: HomeContent }) {
  const sectionOrder = content.sectionOrder ?? [
    "hero",
    "about",
    "focusAreas",
  ];

  return (
    <div id="top" lang={content.locale}>
      <Header
        locale={content.locale}
        anchors={content.anchors}
        content={content.header}
      />
      <main>
        {sectionOrder.map((section) => {
          switch (section) {
            case "hero":
              return (
                <Hero
                  key={section}
                  anchors={content.anchors}
                  content={content.hero}
                />
              );
            case "about":
              return (
                <About
                  key={section}
                  id={content.anchors.about}
                  content={content.about}
                />
              );
            case "focusAreas":
              return (
                <FocusAreas
                  key={section}
                  id={content.anchors.work}
                  content={content.focusAreas}
                />
              );
          }
        })}
      </main>
      <Footer id={content.anchors.contact} content={content.footer} />
      <BackToTop label={content.backToTopLabel} />
    </div>
  );
}
