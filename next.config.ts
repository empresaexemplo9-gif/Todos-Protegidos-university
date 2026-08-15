import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A checagem de tipos roda separadamente (tsc); não bloqueia o build na Vercel.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
