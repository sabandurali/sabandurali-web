import { createRootLayoutMetadata } from "@/components/layout/root-metadata";
import SkipLink from "@/components/ui/SkipLink";
import { fontVariables } from "../fonts";
import "../globals.css";

export const metadata = createRootLayoutMetadata("tr");

/**
 * Time-based safety net for every route below this layout. A route
 * revalidates at the lowest `revalidate` of its layouts and page
 * (node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md,
 * "Route segment config revalidate"), so this hour also refreshes the
 * header and footer navigation on prerendered pages: a link to a scheduled
 * page appears within an hour of its publishing time, which no CMS write
 * announces. Pages may export a lower value; dynamic routes stay dynamic.
 */
export const revalidate = 3600;

export default function TurkishRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" data-scroll-behavior="smooth" className={fontVariables}>
      <body>
        <SkipLink>İçeriğe geç</SkipLink>
        {children}
      </body>
    </html>
  );
}
