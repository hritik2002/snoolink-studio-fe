import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Bypass TypeScript errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Bypass ESLint errors during build
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  // Note: For App Router API routes, body size limits need to be handled via environment variables
  // or by streaming files instead of buffering
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb', // Increased for video uploads
    },
  },
};

export default nextConfig;
