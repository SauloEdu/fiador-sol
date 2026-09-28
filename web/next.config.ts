import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // As chaves do servidor (admin/keeper) ficam só nas API routes.
  serverExternalPackages: ["@anchor-lang/core"],
};

export default nextConfig;
