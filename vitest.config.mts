import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      // next-intl ESM code imports "next/navigation" (no .js extension) which
      // fails in Vitest's strict ESM resolution. Map bare Next.js sub-paths to
      // their .js entry points so the imports resolve correctly.
      "next/navigation": resolve(root, "node_modules/next/navigation.js"),
      "next/headers": resolve(root, "node_modules/next/headers.js"),
      "next/router": resolve(root, "node_modules/next/router.js"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Exclude node_modules and Playwright e2e specs from unit test discovery
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
  },
});
