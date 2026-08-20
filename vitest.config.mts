import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      "next/image": resolve(root, "web/app/compat/next-image.tsx"),
      "next/link": resolve(root, "web/app/compat/next-link.tsx"),
      "next/navigation": resolve(root, "web/app/compat/next-navigation.ts"),
      "next/headers": resolve(root, "web/app/compat/next-headers.ts"),
      "next/server": resolve(root, "web/app/compat/next-server.ts"),
      "next/cache": resolve(root, "web/app/compat/next-cache.ts"),
      "next/dynamic": resolve(root, "web/app/compat/next-dynamic.tsx"),
      "next/script": resolve(root, "web/app/compat/next-script.tsx"),
      "next/font/google": resolve(root, "web/app/compat/next-font.ts"),
      "next-intl": resolve(root, "web/app/compat/next-intl.tsx"),
      "@sentry/nextjs": resolve(root, "web/app/compat/sentry.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Exclude node_modules and Playwright e2e specs from unit test discovery
    exclude: ["node_modules/**", "web/node_modules/**", "web/build/**", "e2e/**"],
  },
});
