import type { Metadata } from "next";
import SkipLink from "@/components/ui/SkipLink";
import { siteUrl } from "@/config/site";
import { fontVariables } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Şaban Durali | Research and Knowledge Platform",
  description:
    "An independent platform producing reliable knowledge, actionable analysis and sustainable value across real estate, consulting, research and technology.",
};

export default function EnglishRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // `scheme-dark` and the body classes keep the pre-atlas dark ground for
    // pages not yet rebuilt with src/components/ui; the atlas layout drops
    // them so the İstanbul Atlası base ground (globals.css) applies.
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${fontVariables} scheme-dark`}
    >
      <body className="bg-background text-foreground">
        <SkipLink>Skip to content</SkipLink>
        {children}
      </body>
    </html>
  );
}
