import type { NextConfig } from "next";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

// Both apps share the single monorepo-root .env. Next.js only auto-loads
// apps/web/.env, so load the root file here (before Next inlines any
// NEXT_PUBLIC_* values into the client bundle). Values already present in the
// environment (e.g. set inline at build time) take precedence.
loadEnv({ path: resolve(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  transpilePackages: ["@submission/shared"]
};

export default nextConfig;
