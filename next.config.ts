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
      // CDN / CloudFront (when NEXT_PUBLIC_CDN_URL is set)
      { protocol: "https", hostname: "cdn.snoolink.com", pathname: "/**" },
      { protocol: "https", hostname: "d3fnir5ezqp2ba.cloudfront.net", pathname: "/**" },
      // S3 virtual-hosted URLs: bucket.s3.region.amazonaws.com (required — "**" does not match all hosts)
      {
        protocol: "https",
        hostname:
          process.env.NEXT_PUBLIC_S3_BUCKET_NAME && process.env.NEXT_PUBLIC_S3_REGION
            ? `${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_S3_REGION}.amazonaws.com`
            : "app.snoolink.com.s3.us-east-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**",
        pathname: "/**",
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
