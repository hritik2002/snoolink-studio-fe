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
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb', // Adjust as needed
    },
  },
};

export default nextConfig;
