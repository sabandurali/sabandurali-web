import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertProductionPayloadInfrastructure } from "./src/lib/payloadInfrastructure";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

assertProductionPayloadInfrastructure();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            // Keep Next.js static hydration, Payload editor workers and image
            // previews working. A strict script policy needs a separate rollout.
            value:
              "object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self' https://formspree.io",
          },
        ],
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
    localPatterns: [
      {
        pathname: "/articles/**",
      },
      {
        pathname: "/books/**",
      },
      {
        pathname: "/brand/**",
      },
      {
        pathname: "/workspaces/**",
      },
      {
        pathname: "/api/media/file/**",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.blob.vercel-storage.com",
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
