import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const fastApiUrl =
      process.env.FASTAPI_URL ||
      (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : "");

    // If FASTAPI_URL is configured (e.g. decoupled backend) or in dev, proxy to that URL.
    // In production on Vercel, leave routing to platform-level vercel.json so Next.js does not
    // try to render /api/index.py as an internal React page route.
    if (fastApiUrl) {
      return [
        {
          source: "/api/v1/:path*",
          destination: `${fastApiUrl}/api/v1/:path*`,
        },
        {
          source: "/health",
          destination: `${fastApiUrl}/health`,
        },
        {
          source: "/docs",
          destination: `${fastApiUrl}/docs`,
        },
        {
          source: "/openapi.json",
          destination: `${fastApiUrl}/openapi.json`,
        },
      ];
    }

    return [];
  },
};

export default nextConfig;

