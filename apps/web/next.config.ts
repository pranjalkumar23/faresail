import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship raw TypeScript (no build step), so Next needs to
  // be told to compile them instead of treating them as pre-built node_modules.
  transpilePackages: ["@travel-deals/shared", "@travel-deals/db"],
};

export default nextConfig;
