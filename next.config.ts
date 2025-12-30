import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/taxi-:slug',
        destination: '/taxi/:slug',
      },
    ];
  },
};

export default nextConfig;
