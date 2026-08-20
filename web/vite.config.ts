import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(root, "..");
const compat = path.join(root, "app/compat");

export default defineConfig({
  envDir: repo,
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  publicDir: path.join(repo, "public"),
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
    alias: [
      { find: "next/image", replacement: path.join(compat, "next-image.tsx") },
      { find: "next/link", replacement: path.join(compat, "next-link.tsx") },
      { find: "next/navigation", replacement: path.join(compat, "next-navigation.ts") },
      { find: "next/headers", replacement: path.join(compat, "next-headers.ts") },
      { find: "next/server", replacement: path.join(compat, "next-server.ts") },
      { find: "next/cache", replacement: path.join(compat, "next-cache.ts") },
      { find: "next/dynamic", replacement: path.join(compat, "next-dynamic.tsx") },
      { find: "next/script", replacement: path.join(compat, "next-script.tsx") },
      { find: "next/font/google", replacement: path.join(compat, "next-font.ts") },
      { find: "next-intl/server", replacement: path.join(compat, "next-intl.tsx") },
      { find: "next-intl", replacement: path.join(compat, "next-intl.tsx") },
      { find: "@sentry/nextjs", replacement: path.join(compat, "sentry.ts") },
      { find: /^next$/, replacement: path.join(compat, "next-stub.ts") },
      { find: "@", replacement: repo },
    ],
  },
});
