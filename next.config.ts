import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertProductionPayloadInfrastructure } from "./src/lib/payloadInfrastructure";
import { securityHeaders } from "./src/lib/securityHeaders";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

assertProductionPayloadInfrastructure();

const nextConfig: NextConfig = {
  // withPayload adds "X-Powered-By: Next.js, Payload" unless this is false.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...securityHeaders],
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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.blob.vercel-storage.com",
        port: "",
        pathname: "/**",
        search: "",
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      ".cjs": [".cts", ".cjs"],
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };

    return webpackConfig;
  },
  turbopack: {
    root: path.resolve(dirname),
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
