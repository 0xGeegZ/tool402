import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  cacheComponents: true,
  transpilePackages: ["@tool402/agent"],
  webpack(config) {
    config.resolve.alias["@x402/paywall"] = false;

    return config;
  },
};

export default nextConfig;
