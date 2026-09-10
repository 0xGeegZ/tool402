import type { NextConfig } from "next";

const browserAdapter = (name: "dotenv-mock" | "winston-mock") =>
  `./src/lib/ats/browser/${name}.ts`;

const nextConfig: NextConfig = {
  agentRules: false,
  cacheComponents: true,
  serverExternalPackages: ["@mattrglobal/node-bbs-signatures"],
  transpilePackages: ["@tool402/agent"],
  turbopack: {
    resolveAlias: {
      dotenv: { browser: browserAdapter("dotenv-mock") },
      winston: { browser: browserAdapter("winston-mock") },
      "winston-daily-rotate-file": { browser: browserAdapter("winston-mock") },
      "winston-transport": { browser: browserAdapter("winston-mock") },
      "@mattrglobal/node-bbs-signatures": {
        browser: "@mattrglobal/bbs-signatures/lib/wasm_module.js",
      },
    },
  },
};

export default nextConfig;
