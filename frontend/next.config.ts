import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // Disabled to support dynamic routes
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
