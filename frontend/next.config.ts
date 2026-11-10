import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone": genera .next/standalone con un server.js y SOLO los node_modules
  // que realmente se usan. Así la imagen final de Docker no copia todo node_modules.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
