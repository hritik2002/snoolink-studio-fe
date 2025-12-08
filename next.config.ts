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
  api: {
    bodyParser: false,
    sizeLimit: "25mb", // increase this to whatever you need
  },
};

export default nextConfig;
