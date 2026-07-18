import type { Metadata } from "next";
import FeedbackForm from "@/components/forms/FeedbackForm";
import BackToTop from "@/components/layout/BackToTop";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { feedbackUrls } from "@/config/site";
import { feedbackContent } from "@/content/feedbackContent";
import { homeContent } from "@/content/homeContent";

const content = feedbackContent.tr;
const home = homeContent.tr;

export const metadata: Metadata = {
  ...content.metadata,
  alternates: {
    canonical: feedbackUrls.tr,
    languages: feedbackUrls,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function TurkishFeedbackPage() {
  return (
    <div id="top" lang="tr">
      <Header
        locale="tr"
        anchors={home.anchors}
        content={home.header}
        homeHref="/"
        anchorPrefix="/"
        languageHrefs={{ tr: "/geri-bildirim", en: "/en/feedback" }}
      />
      <main className="px-4 py-14 sm:px-6 sm:py-18 lg:py-22">
        <div className="mx-auto max-w-3xl">
          <header className="mb-10 border-b border-border pb-8 sm:mb-12 sm:pb-10">
            <p className="text-xs font-semibold tracking-[0.22em] text-accent-soft">
              {content.eyebrow}
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl leading-tight text-ivory sm:text-5xl">
              {content.heading}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
              {content.description}
            </p>
          </header>
          <FeedbackForm content={content} />
        </div>
      </main>
      <Footer id={home.anchors.contact} content={home.footer} />
      <BackToTop label={home.backToTopLabel} />
    </div>
  );
}
