import type { NextConfig } from "next";
const config: NextConfig = {
  ...(process.env.ARIZONA_HOST === "sites"
    ? { output: "export" as const }
    : {}),
  images: { unoptimized: true },
  turbopack: { root: process.cwd() },
};
export default config;
