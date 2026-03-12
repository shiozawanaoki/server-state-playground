import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@server-state-playground/shared'],
  turbopack: {
    root: '/Users/shiozawa.naoki/server-state-playground',
  },
};

export default nextConfig;
