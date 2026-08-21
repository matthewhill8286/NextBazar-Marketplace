import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv, type Plugin } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(root, "..");
const compat = path.join(root, "app/compat");

/** Vercel's Node wrapper imports `./index.js` from an `.mjs` file. Without a
 * sibling `package.json` with `"type": "module"`, Node parses that bundle as
 * CJS and crashes on `import`. The JSON import also pulls the file into NFT. */
function vercelServerEsm(): Plugin {
  let ssr = false;
  return {
    name: "vercel-server-esm",
    apply: "build",
    configResolved(config) {
      ssr = Boolean(config.build.ssr);
    },
    renderChunk(code, chunk) {
      if (!ssr || !chunk.isEntry || !chunk.fileName.endsWith(".js")) return;
      if (code.includes('import "./package.json"')) return;
      return {
        code: `import "./package.json" with { type: "json" };\n${code}`,
        map: null,
      };
    },
    writeBundle(options) {
      if (!ssr || !options.dir) return;
      writeFileSync(
        path.join(options.dir, "package.json"),
        `${JSON.stringify({ type: "module" }, null, 2)}\n`,
      );
    },
  };
}

/** Next.js inlined `process.env.NEXT_PUBLIC_*` in the browser. Vite only
 * replaces `import.meta.env.*` unless we define the `process.env` keys. */
function publicProcessEnvDefine(mode: string): Record<string, string> {
  const fileEnv = loadEnv(mode, repo, ["VITE_", "NEXT_PUBLIC_"]);
  const define: Record<string, string> = {};
  for (const [key, value] of Object.entries({ ...fileEnv, ...process.env })) {
    if (!key.startsWith("NEXT_PUBLIC_") && !key.startsWith("VITE_")) continue;
    define[`process.env.${key}`] = JSON.stringify(value ?? "");
  }
  return define;
}

export default defineConfig(({ mode }) => ({
  envDir: repo,
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  define: publicProcessEnvDefine(mode),
  publicDir: path.join(repo, "public"),
  ssr: {
    noExternal: [/^@sentry\//],
  },
  plugins: [tailwindcss(), reactRouter(), vercelServerEsm()],
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
}));
