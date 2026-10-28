import type { Metadata } from "next";
import SkipLink from "@/components/ui/SkipLink";
import { siteUrl } from "@/config/site";
import { fontVariables } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Şaban Durali | Araştırma ve Bilgi Platformu",
  description:
    "Gayrimenkul, danışmanlık, araştırma ve teknoloji alanlarında güvenilir bilgi, uygulanabilir analiz ve sürdürülebilir değer üreten bağımsız platform.",
};

export default function TurkishRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // `scheme-dark` and the body classes keep the pre-atlas dark ground for
    // pages not yet rebuilt with src/components/ui; the atlas layout drops
    // them so the İstanbul Atlası base ground (globals.css) applies.
    <html
      lang="tr"
      data-scroll-behavior="smooth"
      className={`${fontVariables} scheme-dark`}
    >
      <body className="bg-background text-foreground">
        <SkipLink>İçeriğe geç</SkipLink>
        {children}
      </body>
    </html>
  );
}
