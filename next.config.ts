import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const fastApiUrl =
      process.env.FASTAPI_URL ||
      (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : "");

    // If FASTAPI_URL is configured (e.g. decoupled backend) or in dev, proxy to that URL.
    // Otherwise on Vercel unified deployment, route to the Python serverless entrypoint.
    const destinationTarget = (path: string) =>
      fastApiUrl ? `${fastApiUrl}${path}` : `/api/index.py`;

    return [
      {
        source: "/api/v1/:path*",
        destination: destinationTarget("/api/v1/:path*"),
      },
      {
        source: "/health",
        destination: destinationTarget("/health"),
      },
      {
        source: "/docs",
        destination: destinationTarget("/docs"),
      },
      {
        source: "/openapi.json",
        destination: destinationTarget("/openapi.json"),
      },
    ];
  },
};

export default nextConfig;

