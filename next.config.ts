import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getWorkspaceSectionRedirects } from "./src/content/workspace-redirects";
import {
  assertProductionPayloadInfrastructure,
  getPayloadStorageProvider,
  getVercelBlobStoreHostname,
} from "./src/lib/payloadInfrastructure";
import {
  ADMIN_ROUTES_SOURCE,
  PUBLIC_ROUTES_SOURCE,
  adminRouteSecurityHeaders,
  publicRouteSecurityHeaders,
  scopePayloadClientHintHeaders,
  securityHeaders,
} from "./src/lib/securityHeaders";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

assertProductionPayloadInfrastructure();

/**
 * Payload serves media through `/api/media/file/*`, so the optimizer only
 * needs a remote pattern for direct Blob URLs, and only for this project's
 * own store. Without a Blob token (local storage, CI) there is none, so no
 * other Blob store can be proxied through `/_next/image`.
 */
const blobStoreHostname =
  getPayloadStorageProvider() === "vercel-blob"
    ? getVercelBlobStoreHostname()
    : null;

const nextConfig: NextConfig = {
  // withPayload adds "X-Powered-By: Next.js, Payload" unless this is false.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...securityHeaders],
      },
      {
        // Report-only: blocks nothing on the public site (docs/SECURITY.md).
        source: PUBLIC_ROUTES_SOURCE,
        headers: [...publicRouteSecurityHeaders],
      },
      {
        // Report-only as well: the admin policy adds Monaco's CDN.
        source: ADMIN_ROUTES_SOURCE,
        headers: [...adminRouteSecurityHeaders],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/en/photos",
        destination: "/en/photography",
        permanent: true,
      },
      {
        source: "/en/photos/:path*",
        destination: "/en/photography/:path*",
        permanent: true,
      },
      // The legacy Turkish home record (a standard page with this slug) is
      // rendered at `/`; one URL per document.
      {
        source: "/ana-sayfa",
        destination: "/",
        permanent: true,
      },
      // Workspace sections that live on another page. Served here, before
      // the filesystem, not by the ISR `[section]` route (see the module).
      ...getWorkspaceSectionRedirects(),
    ];
  },
  experimental: {
    globalNotFound: true,
  },
  images: {
    // `search: ""` rejects query strings. Without it every `?x=<random>` is a
    // new cache entry for the optimizer (and a Payload function call for media).
    localPatterns: [
      { pathname: "/articles/**", search: "" },
      { pathname: "/books/**", search: "" },
      { pathname: "/brand/**", search: "" },
      { pathname: "/workspaces/**", search: "" },
      { pathname: "/api/media/file/**", search: "" },
    ],
    remotePatterns:
      blobStoreHostname === null
        ? []
        : [
            {
              protocol: "https",
              hostname: blobStoreHostname,
              port: "",
              pathname: "/**",
              search: "",
            },
          ],
  },
  // Turbopack builds and serves the app (`next dev` and `next build`); a
  // `webpack()` hook would never run, so there is none.
  turbopack: {
    root: path.resolve(dirname),
  },
};

const payloadConfig = withPayload(nextConfig, {
  devBundleServerPackages: false,
});

/**
 * `withPayload` appends `Accept-CH`, `Critical-CH` and `Vary` for the admin's
 * color-scheme hint on every route; they stay on the admin only
 * (`scopePayloadClientHintHeaders`).
 */
const config: NextConfig = {
  ...payloadConfig,
  async headers() {
    const rules = (await payloadConfig.headers?.()) ?? [];
    return scopePayloadClientHintHeaders(rules);
  },
};

export default config;
