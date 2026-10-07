import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite verificar produção em outra pasta sem interromper o next dev local.
  distDir: process.env.ARARAT_BUILD_DIR || ".next",
};

export default nextConfig;
