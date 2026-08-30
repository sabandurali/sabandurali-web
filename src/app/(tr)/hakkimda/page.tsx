import type { Metadata } from "next";
import BackToTop from "@/components/layout/BackToTop";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import About from "@/components/sections/About";
import { getAbsoluteUrl } from "@/config/site";
import { homeContent } from "@/content/homeContent";

export const metadata: Metadata = { title: "Hakkımda | Şaban Durali", description: "Şaban Durali'nin çalışma alanları ve platform yaklaşımı.", alternates: { canonical: getAbsoluteUrl("/hakkimda") } };

export default function AboutPage() { const home = homeContent.tr; return <div id="top" lang="tr"><Header locale="tr" anchors={home.anchors} content={home.header} homeHref="/" anchorPrefix="/" languageHrefs={{ tr: "/hakkimda", en: "/en" }} /><main><About id="hakkimda" content={home.about} /></main><Footer id={home.anchors.contact} content={home.footer} /><BackToTop label={home.backToTopLabel} /></div>; }
