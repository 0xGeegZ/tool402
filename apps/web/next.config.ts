import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  cacheComponents: true,
  transpilePackages: ["@tool402/agent"],
};

export default nextConfig;
