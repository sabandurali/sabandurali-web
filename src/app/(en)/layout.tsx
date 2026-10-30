import { Analytics } from "@vercel/analytics/next";
import { createRootLayoutMetadata } from "@/components/layout/root-metadata";
import SkipLink from "@/components/ui/SkipLink";
import { fontVariables } from "../fonts";
import "../globals.css";

export const metadata = createRootLayoutMetadata("en");

/** Time-based safety net for every route below; see the (tr) layout. */
export const revalidate = 3600;

export default function EnglishRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={fontVariables}>
      <body>
        <SkipLink>Skip to content</SkipLink>
        {children}
        {/* Vercel Web Analytics: cookieless page views, sent to this
            origin (/_vercel/insights); see docs/SECURITY.md. */}
        <Analytics />
      </body>
    </html>
  );
}
